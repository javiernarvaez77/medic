-- Allow anonymous users to read sedes during registration
CREATE POLICY "Anonymous users can view sedes"
ON public.sedes FOR SELECT TO anon
USING (true);