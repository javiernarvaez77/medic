
-- Blood Pressure readings
CREATE TABLE public.blood_pressure_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  measurement_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_pressure_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bp readings" ON public.blood_pressure_readings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient bp readings" ON public.blood_pressure_readings FOR SELECT USING (
  has_role(auth.uid(), 'doctor'::app_role) AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Glucose readings
CREATE TABLE public.glucose_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  value NUMERIC NOT NULL,
  meal_context TEXT NOT NULL CHECK (meal_context IN ('before_meal', 'after_meal', 'fasting', 'other')),
  meal_type TEXT,
  measurement_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own glucose readings" ON public.glucose_readings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient glucose readings" ON public.glucose_readings FOR SELECT USING (
  has_role(auth.uid(), 'doctor'::app_role) AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Weight records with BMI
CREATE TABLE public.weight_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight_kg NUMERIC NOT NULL,
  height_cm NUMERIC NOT NULL,
  bmi NUMERIC GENERATED ALWAYS AS (weight_kg / ((height_cm / 100.0) * (height_cm / 100.0))) STORED,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weight records" ON public.weight_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient weight records" ON public.weight_records FOR SELECT USING (
  has_role(auth.uid(), 'doctor'::app_role) AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);
