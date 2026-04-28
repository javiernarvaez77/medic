CREATE POLICY "Doctors can manage sedes"
ON public.sedes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role))
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));