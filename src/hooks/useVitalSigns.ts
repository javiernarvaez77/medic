import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useBloodPressureReadings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blood_pressure", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_pressure_readings")
        .select("*")
        .eq("user_id", user!.id)
        .order("measurement_time", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useTodayBPCount = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["blood_pressure_today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_pressure_readings")
        .select("id")
        .eq("user_id", user!.id)
        .gte("measurement_time", `${today}T00:00:00`)
        .lte("measurement_time", `${today}T23:59:59`);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });
};

export const useAddBloodPressure = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reading: { systolic: number; diastolic: number; pulse?: number; notes?: string }) => {
      const { error } = await supabase.from("blood_pressure_readings").insert({
        ...reading,
        user_id: user!.id,
        measurement_time: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blood_pressure"] });
      qc.invalidateQueries({ queryKey: ["blood_pressure_today"] });
    },
  });
};

export const useDeleteBloodPressure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blood_pressure_readings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blood_pressure"] });
      qc.invalidateQueries({ queryKey: ["blood_pressure_today"] });
    },
  });
};

export const useGlucoseReadings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["glucose", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glucose_readings")
        .select("*")
        .eq("user_id", user!.id)
        .order("measurement_time", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddGlucose = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reading: { value: number; meal_context: string; meal_type?: string; notes?: string }) => {
      const { error } = await supabase.from("glucose_readings").insert({
        ...reading,
        user_id: user!.id,
        measurement_time: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["glucose"] }),
  });
};

export const useDeleteGlucose = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("glucose_readings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["glucose"] }),
  });
};

export const useWeightRecords = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["weight", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_records")
        .select("*")
        .eq("user_id", user!.id)
        .order("measurement_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddWeight = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: { weight_kg: number; height_cm: number; notes?: string }) => {
      const { error } = await supabase.from("weight_records").insert({
        ...record,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight"] }),
  });
};

export const useDeleteWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight"] }),
  });
};

export const useMyDoctors = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_doctors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_patients")
        .select("*, profiles!doctor_patients_doctor_id_fkey(full_name, phone, avatar_url)")
        .eq("patient_id", user!.id);
      if (error) {
        // Fallback: query without join if FK not set up
        const { data: dpData, error: dpError } = await supabase
          .from("doctor_patients")
          .select("*")
          .eq("patient_id", user!.id);
        if (dpError) throw dpError;
        
        // Get doctor profiles separately
        if (!dpData || dpData.length === 0) return [];
        const doctorIds = dpData.map(d => d.doctor_id);
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, avatar_url")
          .in("user_id", doctorIds);
        if (profError) throw profError;
        
        return dpData.map(dp => ({
          ...dp,
          doctor_profile: profiles?.find(p => p.user_id === dp.doctor_id) ?? null,
        }));
      }
      return data;
    },
    enabled: !!user,
  });
};
