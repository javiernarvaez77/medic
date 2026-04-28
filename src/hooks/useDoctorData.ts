import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type PatientWithProfile = Tables<"profiles"> & {
  conditions?: Tables<"patient_conditions">[];
  medications?: Tables<"medications">[];
  appointments?: Tables<"appointments">[];
  allergies?: Tables<"allergies">[];
  labResults?: Tables<"lab_results">[];
  medLogs?: Tables<"medication_logs">[];
  bpReadings?: Tables<"blood_pressure_readings">[];
  glucoseReadings?: Tables<"glucose_readings">[];
  weightRecords?: Tables<"weight_records">[];
};

export type ClinicalNote = {
  id: string;
  doctor_id: string;
  patient_id: string;
  content: string;
  category: string;
  created_at: string;
};

export const useUserRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? "patient";
    },
    enabled: !!user,
  });
};

export const useDoctorPatients = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["doctor_patients", user?.id],
    queryFn: async () => {
      const { data: assignments, error: aErr } = await supabase
        .from("doctor_patients")
        .select("patient_id")
        .eq("doctor_id", user!.id);
      if (aErr) throw aErr;

      const patientIds = (assignments ?? []).map((a) => a.patient_id);
      if (patientIds.length === 0) return [];

      // Fetch in batches of 500 to handle >1000 patients
      const BATCH_SIZE = 500;
      const allProfiles: Tables<"profiles">[] = [];
      for (let i = 0; i < patientIds.length; i += BATCH_SIZE) {
        const batch = patientIds.slice(i, i + BATCH_SIZE);
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", batch);
        if (pErr) throw pErr;
        allProfiles.push(...(profiles ?? []));
      }

      return allProfiles;
    },
    enabled: !!user,
  });
};

export const usePatientDetail = (patientId: string | null) => {
  return useQuery({
    queryKey: ["patient_detail", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const [profile, conditions, medications, appointments, allergies, labResults, medLogs, bpReadings, glucoseReadings, weightRecords] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", patientId).maybeSingle(),
          supabase.from("patient_conditions").select("*").eq("user_id", patientId).order("created_at", { ascending: false }),
          supabase.from("medications").select("*").eq("user_id", patientId).eq("active", true).order("name"),
          supabase.from("appointments").select("*").eq("user_id", patientId).order("appointment_date", { ascending: false }).limit(5),
          supabase.from("allergies").select("*").eq("user_id", patientId),
          supabase.from("lab_results").select("*").eq("user_id", patientId).order("result_date", { ascending: false }).limit(10),
          (() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return supabase.from("medication_logs").select("*").eq("user_id", patientId).gte("log_date", sevenDaysAgo.toISOString().split("T")[0]);
          })(),
          supabase.from("blood_pressure_readings").select("*").eq("user_id", patientId).order("measurement_time", { ascending: false }).limit(20),
          supabase.from("glucose_readings").select("*").eq("user_id", patientId).order("measurement_time", { ascending: false }).limit(20),
          supabase.from("weight_records").select("*").eq("user_id", patientId).order("measurement_date", { ascending: false }).limit(20),
        ]);

      if (profile.error) throw profile.error;

      return {
        ...profile.data!,
        conditions: conditions.data ?? [],
        medications: medications.data ?? [],
        appointments: appointments.data ?? [],
        allergies: allergies.data ?? [],
        labResults: labResults.data ?? [],
        medLogs: medLogs.data ?? [],
        bpReadings: bpReadings.data ?? [],
        glucoseReadings: glucoseReadings.data ?? [],
        weightRecords: weightRecords.data ?? [],
      } as PatientWithProfile;
    },
    enabled: !!patientId,
  });
};

/** Fetch all appointments created by this doctor */
export const useDoctorAppointments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["doctor_appointments", user?.id],
    queryFn: async () => {
      // Get assigned patient IDs
      const { data: assignments, error: aErr } = await supabase
        .from("doctor_patients")
        .select("patient_id")
        .eq("doctor_id", user!.id);
      if (aErr) throw aErr;
      const patientIds = (assignments ?? []).map((a) => a.patient_id);
      if (patientIds.length === 0) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .in("user_id", patientIds)
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
};

/** Add appointment for a patient (doctor creates it) */
export const useAddDoctorAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (apt: {
      user_id: string;
      doctor_name: string;
      specialty: string | null;
      appointment_date: string;
      location: string | null;
      notes: string | null;
      modality: string;
      ips: string | null;
    }) => {
      const { error } = await supabase.from("appointments").insert(apt as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patient_detail"] });
    },
  });
};

/** Cancel an appointment */
export const useCancelAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" as any })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patient_detail"] });
    },
  });
};

/** Mark appointment as completed */
export const useCompleteAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" as any })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patient_detail"] });
    },
  });
};

/** Reschedule an appointment */
export const useRescheduleAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      newDate,
      newModality,
      newLocation,
      newIps,
    }: {
      appointmentId: string;
      newDate: string;
      newModality?: string;
      newLocation?: string | null;
      newIps?: string | null;
    }) => {
      const update: Record<string, any> = {
        appointment_date: newDate,
        status: "rescheduled",
      };
      if (newModality !== undefined) update.modality = newModality;
      if (newLocation !== undefined) update.location = newLocation;
      if (newIps !== undefined) update.ips = newIps;
      const { error } = await supabase
        .from("appointments")
        .update(update)
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patient_detail"] });
    },
  });
};

/** Fetch clinical notes for a patient */
export const useClinicalNotes = (patientId: string | null) => {
  return useQuery({
    queryKey: ["clinical_notes", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_notes" as any)
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClinicalNote[];
    },
    enabled: !!patientId,
  });
};

/** Add a clinical note */
export const useAddClinicalNote = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ patientId, content, category }: { patientId: string; content: string; category?: string }) => {
      const { error } = await supabase
        .from("clinical_notes" as any)
        .insert({ doctor_id: user!.id, patient_id: patientId, content, category: category ?? "evolucion" } as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["clinical_notes", variables.patientId] });
    },
  });
};

/** Delete a clinical note */
export const useDeleteClinicalNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, patientId }: { noteId: string; patientId: string }) => {
      const { error } = await supabase
        .from("clinical_notes" as any)
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      return patientId;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["clinical_notes", variables.patientId] });
    },
  });
};
