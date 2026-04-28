
-- Add category enum and column to clinical_notes
CREATE TYPE public.clinical_note_category AS ENUM ('evolucion', 'interconsulta', 'plan_manejo', 'educacion', 'otro');

ALTER TABLE public.clinical_notes
  ADD COLUMN category public.clinical_note_category NOT NULL DEFAULT 'evolucion';
