
-- Add new programs array column
ALTER TABLE public.profiles ADD COLUMN programs text[] DEFAULT '{}';

-- Migrate existing data from program to programs
UPDATE public.profiles
SET programs = CASE
  WHEN program IS NOT NULL AND program != 'otro' THEN ARRAY[program::text]
  ELSE '{}'
END;

-- Drop old program column
ALTER TABLE public.profiles DROP COLUMN program;
