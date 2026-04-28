
CREATE OR REPLACE FUNCTION public.get_doctor_kpis(_doctor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _patient_ids uuid[];
  _total_patients int;
  _completed int;
  _cancelled int;
  _scheduled int;
  _completion_rate int;
  _active_alerts int := 0;
  _critical_alerts int := 0;
  _avg_adherence int := 0;
  _patient_adherence jsonb := '[]'::jsonb;
  _appointments_by_month jsonb := '[]'::jsonb;
  _alerts_by_type jsonb := '[]'::jsonb;
  _seven_days_ago date;
  _bp_alerts int := 0;
  _glucose_alerts int := 0;
  _bmi_alerts int := 0;
  _med_alerts int := 0;
  _rec record;
BEGIN
  -- 1. Get assigned patient IDs
  SELECT array_agg(patient_id) INTO _patient_ids
  FROM doctor_patients WHERE doctor_id = _doctor_id;

  IF _patient_ids IS NULL THEN
    RETURN jsonb_build_object(
      'totalPatients', 0, 'appointmentsScheduled', 0,
      'appointmentsCompleted', 0, 'appointmentsCancelled', 0,
      'appointmentsCompletionRate', 0, 'activeAlerts', 0,
      'criticalAlerts', 0, 'avgAdherence', 0,
      'patientAdherenceList', '[]'::jsonb,
      'appointmentsByMonth', '[]'::jsonb,
      'alertsByType', '[]'::jsonb
    );
  END IF;

  _total_patients := array_length(_patient_ids, 1);

  -- 2. Appointment KPIs
  SELECT
    coalesce(sum(case when status = 'completed' then 1 else 0 end), 0),
    coalesce(sum(case when status = 'cancelled' then 1 else 0 end), 0),
    coalesce(sum(case when status in ('scheduled','rescheduled') then 1 else 0 end), 0)
  INTO _completed, _cancelled, _scheduled
  FROM appointments WHERE user_id = ANY(_patient_ids);

  IF (_completed + _cancelled + _scheduled) > 0 THEN
    _completion_rate := round((_completed::numeric / (_completed + _cancelled + _scheduled)) * 100);
  ELSE
    _completion_rate := 0;
  END IF;

  -- 3. Appointments by month (last 6 months)
  SELECT coalesce(jsonb_agg(row_to_json(m)::jsonb ORDER BY m.month_start), '[]'::jsonb)
  INTO _appointments_by_month
  FROM (
    SELECT
      to_char(gs, 'Mon YY') as month,
      gs as month_start,
      coalesce(sum(case when a.status = 'completed' then 1 else 0 end), 0) as completed,
      coalesce(sum(case when a.status = 'cancelled' then 1 else 0 end), 0) as cancelled,
      coalesce(sum(case when a.status in ('scheduled','rescheduled') then 1 else 0 end), 0) as scheduled
    FROM generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) gs
    LEFT JOIN appointments a ON a.user_id = ANY(_patient_ids)
      AND date_trunc('month', a.appointment_date) = gs
    GROUP BY gs
  ) m;

  -- 4. Adherence per patient (last 7 days)
  _seven_days_ago := current_date - 7;

  WITH patient_adherence AS (
    SELECT
      p.user_id as pid,
      p.full_name as name,
      coalesce(sum(array_length(med.times, 1)), 0) * 7 as expected,
      coalesce((
        SELECT count(*)
        FROM medication_logs ml
        WHERE ml.user_id = p.user_id
          AND ml.taken_at IS NOT NULL
          AND ml.log_date >= _seven_days_ago
          AND ml.medication_id IN (SELECT id FROM medications WHERE user_id = p.user_id AND active = true)
      ), 0) as taken
    FROM profiles p
    JOIN medications med ON med.user_id = p.user_id AND med.active = true
    WHERE p.user_id = ANY(_patient_ids)
    GROUP BY p.user_id, p.full_name
  )
  SELECT
    coalesce(jsonb_agg(
      jsonb_build_object('name', pa.name, 'adherence', 
        CASE WHEN pa.expected > 0 THEN LEAST(100, round((pa.taken::numeric / pa.expected) * 100)) ELSE 0 END
      ) ORDER BY CASE WHEN pa.expected > 0 THEN (pa.taken::numeric / pa.expected) ELSE 0 END
    ), '[]'::jsonb),
    CASE WHEN count(*) > 0 THEN round(avg(
      CASE WHEN pa.expected > 0 THEN LEAST(100, (pa.taken::numeric / pa.expected) * 100) ELSE 0 END
    )) ELSE 0 END
  INTO _patient_adherence, _avg_adherence
  FROM patient_adherence pa;

  -- 5. Clinical alerts
  -- BP alerts
  FOR _rec IN
    SELECT DISTINCT ON (user_id) user_id, systolic, diastolic
    FROM blood_pressure_readings
    WHERE user_id = ANY(_patient_ids)
    ORDER BY user_id, measurement_time DESC
  LOOP
    IF _rec.systolic >= 140 OR _rec.systolic < 90 OR _rec.diastolic >= 90 OR _rec.diastolic < 60 THEN
      _active_alerts := _active_alerts + 1;
      _bp_alerts := _bp_alerts + 1;
      IF _rec.systolic >= 160 OR _rec.diastolic >= 100 THEN
        _critical_alerts := _critical_alerts + 1;
      END IF;
    END IF;
  END LOOP;

  -- Glucose alerts
  FOR _rec IN
    SELECT DISTINCT ON (user_id) user_id, value
    FROM glucose_readings
    WHERE user_id = ANY(_patient_ids)
    ORDER BY user_id, measurement_time DESC
  LOOP
    IF _rec.value > 180 OR _rec.value < 70 THEN
      _active_alerts := _active_alerts + 1;
      _glucose_alerts := _glucose_alerts + 1;
      IF _rec.value > 250 OR _rec.value < 54 THEN
        _critical_alerts := _critical_alerts + 1;
      END IF;
    END IF;
  END LOOP;

  -- BMI alerts
  FOR _rec IN
    SELECT DISTINCT ON (user_id) user_id, bmi
    FROM weight_records
    WHERE user_id = ANY(_patient_ids) AND bmi IS NOT NULL
    ORDER BY user_id, measurement_date DESC
  LOOP
    IF _rec.bmi >= 30 OR _rec.bmi < 18.5 THEN
      _active_alerts := _active_alerts + 1;
      _bmi_alerts := _bmi_alerts + 1;
      IF _rec.bmi >= 35 OR _rec.bmi < 16 THEN
        _critical_alerts := _critical_alerts + 1;
      END IF;
    END IF;
  END LOOP;

  -- Medication non-adherence alerts (no log in 24h)
  SELECT count(*) INTO _med_alerts
  FROM (
    SELECT DISTINCT m.user_id
    FROM medications m
    WHERE m.user_id = ANY(_patient_ids) AND m.active = true
    AND NOT EXISTS (
      SELECT 1 FROM medication_logs ml
      WHERE ml.user_id = m.user_id
        AND ml.taken_at IS NOT NULL
        AND ml.taken_at >= now() - interval '24 hours'
    )
  ) sub;
  _active_alerts := _active_alerts + _med_alerts;

  -- Build alerts by type
  SELECT coalesce(jsonb_agg(jsonb_build_object('type', t.type, 'count', t.count)), '[]'::jsonb)
  INTO _alerts_by_type
  FROM (
    SELECT * FROM (VALUES
      ('Presión arterial', _bp_alerts),
      ('Glucosa', _glucose_alerts),
      ('IMC', _bmi_alerts),
      ('Medicamentos', _med_alerts)
    ) AS v(type, count)
    WHERE count > 0
  ) t;

  RETURN jsonb_build_object(
    'totalPatients', _total_patients,
    'appointmentsScheduled', _scheduled,
    'appointmentsCompleted', _completed,
    'appointmentsCancelled', _cancelled,
    'appointmentsCompletionRate', _completion_rate,
    'activeAlerts', _active_alerts,
    'criticalAlerts', _critical_alerts,
    'avgAdherence', _avg_adherence,
    'patientAdherenceList', _patient_adherence,
    'appointmentsByMonth', _appointments_by_month,
    'alertsByType', _alerts_by_type
  );
END;
$$;
