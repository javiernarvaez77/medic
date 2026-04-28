
-- Clinical notes table: doctors write notes on their patients
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

-- Doctors can manage notes they created for their assigned patients
CREATE POLICY "Doctors manage own clinical notes"
  ON public.clinical_notes
  FOR ALL
  TO authenticated
  USING (
    doctor_id = auth.uid()
    AND patient_id IN (
      SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id = auth.uid()
    AND patient_id IN (
      SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
    )
  );
