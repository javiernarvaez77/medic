
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'caregiver', 'admin');

-- Enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Enum for chronic programs
CREATE TYPE public.chronic_program AS ENUM (
  'riesgo_cardiovascular',
  'diabetes',
  'hipertension',
  'enfermedad_renal',
  'enfermedad_respiratoria',
  'tiroides',
  'otro'
);

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  document_id TEXT,
  date_of_birth DATE,
  blood_type TEXT,
  eps TEXT,
  phone TEXT,
  program chronic_program DEFAULT 'otro',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- 3. CONDITIONS (diagnósticos del paciente)
-- ============================================
CREATE TABLE public.patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_conditions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. ALLERGIES
-- ============================================
CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. EMERGENCY CONTACTS
-- ============================================
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. MEDICATIONS
-- ============================================
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TEXT[] NOT NULL DEFAULT '{}',
  condition TEXT,
  instructions TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. MEDICATION LOGS (tracking de tomas)
-- ============================================
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. APPOINTMENTS (citas médicas)
-- ============================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  location TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. LAB RESULTS
-- ============================================
CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  normal_range TEXT,
  result_date DATE NOT NULL,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. PENDING LABS
-- ============================================
CREATE TABLE public.pending_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_labs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. DOCTOR-PATIENT RELATIONSHIPS
-- ============================================
CREATE TABLE public.doctor_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, patient_id)
);

ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES: users see own, doctors see their patients
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- USER ROLES: users see own role, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PATIENT CONDITIONS
CREATE POLICY "Users manage own conditions" ON public.patient_conditions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient conditions" ON public.patient_conditions FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- ALLERGIES
CREATE POLICY "Users manage own allergies" ON public.allergies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient allergies" ON public.allergies FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- EMERGENCY CONTACTS
CREATE POLICY "Users manage own contacts" ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- MEDICATIONS
CREATE POLICY "Users manage own medications" ON public.medications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient medications" ON public.medications FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- MEDICATION LOGS
CREATE POLICY "Users manage own med logs" ON public.medication_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient med logs" ON public.medication_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- APPOINTMENTS
CREATE POLICY "Users manage own appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient appointments" ON public.appointments FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- LAB RESULTS
CREATE POLICY "Users manage own lab results" ON public.lab_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors view patient labs" ON public.lab_results FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND user_id IN (
    SELECT patient_id FROM public.doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- PENDING LABS
CREATE POLICY "Users manage own pending labs" ON public.pending_labs FOR ALL USING (auth.uid() = user_id);

-- DOCTOR-PATIENT RELATIONSHIPS
CREATE POLICY "Doctors manage own patients" ON public.doctor_patients FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Patients view own doctors" ON public.doctor_patients FOR SELECT USING (auth.uid() = patient_id);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
