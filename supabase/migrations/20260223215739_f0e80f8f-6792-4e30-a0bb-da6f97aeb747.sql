
-- Add profession field to profiles (for health professionals)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;

-- Add modality and IPS to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS modality text DEFAULT 'centro_salud';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS ips text;

-- Add IPS to profiles (for health professionals)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ips text;

-- Update app_role enum to keep 'doctor' internally but we'll display it as "Profesional de la Salud" in UI
-- No enum change needed since 'doctor' role already exists and works

-- Comment: profession values will be: medico, enfermera, odontologo, auxiliar_enfermeria
-- Comment: modality values will be: centro_salud, domiciliaria, telemedicina
