import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Medication = Tables<"medications">;
export type MedicationLog = Tables<"medication_logs">;
export type Appointment = Tables<"appointments">;
export type LabResult = Tables<"lab_results">;
export type PendingLab = Tables<"pending_labs">;
export type PatientCondition = Tables<"patient_conditions">;
export type Allergy = Tables<"allergies">;
export type EmergencyContact = Tables<"emergency_contacts">;

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

export const useConditions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conditions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_conditions")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAllergies = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["allergies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allergies")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useEmergencyContacts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["emergency_contacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useMedications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["medications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useTodayMedLogs = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["medication_logs", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("log_date", today);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useWeekMedLogs = () => {
  const { user } = useAuth();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString().split("T")[0];
  return useQuery({
    queryKey: ["medication_logs_week", user?.id, fromDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("log_date", fromDate);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useToggleMedLog = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  return useMutation({
    mutationFn: async ({
      medicationId,
      scheduledTime,
      currentlyTaken,
    }: {
      medicationId: string;
      scheduledTime: string;
      currentlyTaken: boolean;
    }) => {
      if (currentlyTaken) {
        // Remove log
        const { error } = await supabase
          .from("medication_logs")
          .delete()
          .eq("user_id", user!.id)
          .eq("medication_id", medicationId)
          .eq("scheduled_time", scheduledTime)
          .eq("log_date", today);
        if (error) throw error;
      } else {
        // Add log
        const { error } = await supabase.from("medication_logs").insert({
          user_id: user!.id,
          medication_id: medicationId,
          scheduled_time: scheduledTime,
          taken_at: new Date().toISOString(),
          log_date: today,
        });
        if (error) throw error;
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["medication_logs"] }),
  });
};

export const useAppointments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user!.id)
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useLabResults = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lab_results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("result_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const usePendingLabs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending_labs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_labs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed", false)
        .order("due_date");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddMedication = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: { name: string; dose: string; frequency: string; condition: string | null; instructions: string | null; times: string[] }) => {
      const { error } = await supabase.from("medications").insert({ ...med, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
  });
};

export const useAddAppointment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (apt: { doctor_name: string; specialty: string | null; appointment_date: string; location: string | null; notes: string | null }) => {
      const { error } = await supabase.from("appointments").insert({ ...apt, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
};

export const useAddLabResult = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lab: { name: string; value: number | null; unit: string | null; normal_range: string | null; result_date: string; notes: string | null }) => {
      const { error } = await supabase.from("lab_results").insert({ ...lab, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_results"] }),
  });
};

export const useAddAllergy = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (allergy: { name: string; severity?: string; notes?: string }) => {
      const { error } = await supabase.from("allergies").insert({ ...allergy, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allergies"] }),
  });
};

export const useDeleteAllergy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("allergies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allergies"] }),
  });
};

export const useAddCondition = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (condition: { name: string; diagnosed_date?: string; notes?: string }) => {
      const { error } = await supabase.from("patient_conditions").insert({ ...condition, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conditions"] }),
  });
};

export const useDeleteCondition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patient_conditions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conditions"] }),
  });
};

export const useSetPrimaryCondition = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conditionId: string) => {
      // First, unset all primary flags for this user
      const { error: resetError } = await supabase
        .from("patient_conditions")
        .update({ is_primary: false })
        .eq("user_id", user!.id);
      if (resetError) throw resetError;
      // Then set the selected one as primary
      const { error } = await supabase
        .from("patient_conditions")
        .update({ is_primary: true })
        .eq("id", conditionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conditions"] }),
  });
};

export const useAddEmergencyContact = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: { name: string; phone: string; relationship?: string }) => {
      const { error } = await supabase.from("emergency_contacts").insert({ ...contact, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency_contacts"] }),
  });
};

export const useDeleteEmergencyContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency_contacts"] }),
  });
};

export const useUnreadDocuments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread_documents", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clinical_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read_by_patient", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
};

export const useMarkDocumentsRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clinical_documents")
        .update({ read_by_patient: true } as any)
        .eq("user_id", user!.id)
        .eq("read_by_patient", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unread_documents"] }),
  });
};
