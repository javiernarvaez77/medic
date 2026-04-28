
-- Allow doctors to insert conditions for their assigned patients
CREATE POLICY "Doctors can insert patient conditions"
ON public.patient_conditions
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Allow doctors to update conditions for their assigned patients
CREATE POLICY "Doctors can update patient conditions"
ON public.patient_conditions
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Allow doctors to delete conditions for their assigned patients
CREATE POLICY "Doctors can delete patient conditions"
ON public.patient_conditions
FOR DELETE
TO public
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);
