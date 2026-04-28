-- Add doctor_id to clinical_documents to track who uploaded
ALTER TABLE public.clinical_documents ADD COLUMN doctor_id uuid;

-- Allow doctors to INSERT clinical documents for their assigned patients
CREATE POLICY "Doctors can insert clinical documents for patients"
ON public.clinical_documents
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Allow doctors to UPDATE clinical documents they uploaded
CREATE POLICY "Doctors can update own clinical documents"
ON public.clinical_documents
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND doctor_id = auth.uid()
);

-- Storage policies for clinical-documents bucket
-- Doctors can upload files for their patients
CREATE POLICY "Doctors can upload clinical documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clinical-documents'
  AND has_role(auth.uid(), 'doctor'::app_role)
);

-- Doctors can view clinical documents of their patients
CREATE POLICY "Doctors can view clinical documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'clinical-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'doctor'::app_role)
  )
);

-- Patients can view/download their own clinical documents
CREATE POLICY "Patients can view own clinical documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'clinical-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);