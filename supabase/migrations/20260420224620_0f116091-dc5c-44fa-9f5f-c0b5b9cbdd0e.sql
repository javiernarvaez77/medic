CREATE OR REPLACE FUNCTION public.get_doctor_reports(_doctor_id uuid, _days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _patient_ids uuid[];
  _since timestamptz;
  _since_date date;
  _scheduled int := 0;
  _completed int := 0;
  _cancelled int := 0;
  _rescheduled int := 0;
  _total_appts int := 0;
  _adherence_by_patient jsonb := '[]'::jsonb;
  _avg_adherence int := 0;
  _meds_by_program jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() <> _doctor_id OR NOT has_role(auth.uid(), 'doctor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  _since := now() - (_days || ' days')::interval;
  _since_date := (current_date - _days);

  SELECT array_agg(patient_id) INTO _patient_ids
  FROM doctor_patients WHERE doctor_id = _doctor_id;

  IF _patient_ids IS NULL OR array_length(_patient_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'rangeDays', _days,
      'totalPatients', 0,
      'appointments', jsonb_build_object('scheduled',0,'completed',0,'cancelled',0,'rescheduled',0,'total',0,
        'completionRate',0,'cancellationRate',0,'rescheduleRate',0),
      'avgAdherence', 0,
      'adherenceByPatient', '[]'::jsonb,
      'medsByProgram', '[]'::jsonb
    );
  END IF;

  -- Appointments in range
  SELECT
    coalesce(sum(case when status in ('scheduled') then 1 else 0 end),0),
    coalesce(sum(case when status = 'completed' then 1 else 0 end),0),
    coalesce(sum(case when status = 'cancelled' then 1 else 0 end),0),
    coalesce(sum(case when status = 'rescheduled' then 1 else 0 end),0)
  INTO _scheduled, _completed, _cancelled, _rescheduled
  FROM appointments
  WHERE user_id = ANY(_patient_ids) AND appointment_date >= _since;

  _total_appts := _scheduled + _completed + _cancelled + _rescheduled;

  -- Adherence per patient (range)
  WITH pa AS (
    SELECT
      p.user_id as pid,
      p.full_name as name,
      coalesce(p.programs, '{}'::text[]) as programs,
      coalesce(sum(array_length(med.times,1)),0) * _days as expected,
      coalesce((
        SELECT count(*) FROM medication_logs ml
        WHERE ml.user_id = p.user_id
          AND ml.taken_at IS NOT NULL
          AND ml.log_date >= _since_date
          AND ml.medication_id IN (SELECT id FROM medications WHERE user_id = p.user_id AND active = true)
      ),0) as taken
    FROM profiles p
    LEFT JOIN medications med ON med.user_id = p.user_id AND med.active = true
    WHERE p.user_id = ANY(_patient_ids)
    GROUP BY p.user_id, p.full_name, p.programs
  )
  SELECT
    coalesce(jsonb_agg(jsonb_build_object(
      'patientId', pid,
      'name', name,
      'programs', programs,
      'expected', expected,
      'taken', taken,
      'adherence', CASE WHEN expected > 0 THEN LEAST(100, round((taken::numeric/expected)*100)) ELSE 0 END
    ) ORDER BY name), '[]'::jsonb),
    CASE WHEN count(*) FILTER (WHERE expected > 0) > 0
      THEN round(avg(CASE WHEN expected > 0 THEN LEAST(100,(taken::numeric/expected)*100) ELSE NULL END))
      ELSE 0 END
  INTO _adherence_by_patient, _avg_adherence
  FROM pa;

  -- Meds by program
  WITH unnested AS (
    SELECT unnest(coalesce(p.programs,'{}'::text[])) as program, p.user_id
    FROM profiles p WHERE p.user_id = ANY(_patient_ids)
  ),
  by_prog AS (
    SELECT
      u.program,
      count(DISTINCT u.user_id) as patients,
      coalesce(sum(array_length(med.times,1)),0) * _days as expected,
      coalesce((
        SELECT count(*) FROM medication_logs ml
        WHERE ml.user_id IN (SELECT user_id FROM unnested WHERE program = u.program)
          AND ml.taken_at IS NOT NULL
          AND ml.log_date >= _since_date
      ),0) as taken
    FROM unnested u
    LEFT JOIN medications med ON med.user_id = u.user_id AND med.active = true
    GROUP BY u.program
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'program', program,
    'patients', patients,
    'expected', expected,
    'taken', taken,
    'adherence', CASE WHEN expected > 0 THEN LEAST(100, round((taken::numeric/expected)*100)) ELSE 0 END
  ) ORDER BY program), '[]'::jsonb)
  INTO _meds_by_program FROM by_prog;

  RETURN jsonb_build_object(
    'rangeDays', _days,
    'totalPatients', array_length(_patient_ids,1),
    'appointments', jsonb_build_object(
      'scheduled', _scheduled,
      'completed', _completed,
      'cancelled', _cancelled,
      'rescheduled', _rescheduled,
      'total', _total_appts,
      'completionRate', CASE WHEN _total_appts>0 THEN round((_completed::numeric/_total_appts)*100) ELSE 0 END,
      'cancellationRate', CASE WHEN _total_appts>0 THEN round((_cancelled::numeric/_total_appts)*100) ELSE 0 END,
      'rescheduleRate', CASE WHEN _total_appts>0 THEN round((_rescheduled::numeric/_total_appts)*100) ELSE 0 END
    ),
    'avgAdherence', _avg_adherence,
    'adherenceByPatient', _adherence_by_patient,
    'medsByProgram', _meds_by_program
  );
END;
$$;