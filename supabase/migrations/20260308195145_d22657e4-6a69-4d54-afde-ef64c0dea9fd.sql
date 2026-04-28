
-- Create sedes table (IPS + municipality)
CREATE TABLE public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  municipio text NOT NULL,
  departamento text NOT NULL,
  direccion text,
  telefono text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read sedes
CREATE POLICY "Authenticated users can view sedes"
ON public.sedes FOR SELECT TO authenticated
USING (true);

-- Only admins can manage sedes
CREATE POLICY "Admins can manage sedes"
ON public.sedes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add sede_id to profiles
ALTER TABLE public.profiles ADD COLUMN sede_id uuid REFERENCES public.sedes(id);
