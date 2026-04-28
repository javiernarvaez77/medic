
CREATE POLICY "Patients can view own clinical notes"
  ON public.clinical_notes
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());
