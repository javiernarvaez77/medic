
-- Allow doctors to insert appointments for their assigned patients
CREATE POLICY "Doctors can create appointments for patients"
ON public.appointments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Allow doctors to update appointments for their assigned patients
CREATE POLICY "Doctors can update patient appointments"
ON public.appointments
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);
