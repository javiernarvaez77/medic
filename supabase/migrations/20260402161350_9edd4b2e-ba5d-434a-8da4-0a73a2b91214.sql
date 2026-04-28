
-- Allow doctors to insert medications for their patients
CREATE POLICY "Doctors can insert medications for patients"
ON public.medications
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Allow doctors to update medications for their patients
CREATE POLICY "Doctors can update medications for patients"
ON public.medications
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Create notification_logs table for simulated WhatsApp notifications
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_time text NOT NULL,
  notification_type text NOT NULL DEFAULT 'whatsapp',
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Patients can view their own notifications
CREATE POLICY "Users view own notifications"
ON public.notification_logs
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Doctors can view notifications for their patients
CREATE POLICY "Doctors view patient notifications"
ON public.notification_logs
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND user_id IN (
    SELECT patient_id FROM doctor_patients WHERE doctor_id = auth.uid()
  )
);

-- Service role inserts (for edge function or system)
CREATE POLICY "Service can insert notifications"
ON public.notification_logs
FOR INSERT
TO public
WITH CHECK (true);
