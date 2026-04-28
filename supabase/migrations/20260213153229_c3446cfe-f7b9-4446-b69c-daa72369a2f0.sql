
-- Table for home visit records
CREATE TABLE public.home_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visitor_name TEXT NOT NULL,
  reason TEXT,
  observations TEXT,
  vitals JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.home_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own home visits"
  ON public.home_visits FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors view patient home visits"
  ON public.home_visits FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor'::app_role)
    AND user_id IN (
      SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
    )
  );

-- Table for clinical history PDF files
CREATE TABLE public.clinical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own clinical documents"
  ON public.clinical_documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors view patient clinical documents"
  ON public.clinical_documents FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor'::app_role)
    AND user_id IN (
      SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
    )
  );

-- Storage bucket for clinical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('clinical-documents', 'clinical-documents', false);

CREATE POLICY "Users upload own clinical docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clinical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own clinical docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clinical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own clinical docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'clinical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors view patient clinical docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'clinical-documents'
    AND has_role(auth.uid(), 'doctor'::app_role)
    AND (storage.foldername(name))[1] IN (
      SELECT patient_id::text FROM doctor_patients WHERE doctor_id = auth.uid()
    )
  );
