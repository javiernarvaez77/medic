import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DoctorKPIs = {
  totalPatients: number;
  appointmentsScheduled: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  appointmentsCompletionRate: number;
  activeAlerts: number;
  criticalAlerts: number;
  avgAdherence: number;
  patientAdherenceList: { name: string; adherence: number }[];
  appointmentsByMonth: { month: string; completed: number; cancelled: number; scheduled: number }[];
  alertsByType: { type: string; count: number }[];
};

const EMPTY_KPIS: DoctorKPIs = {
  totalPatients: 0,
  appointmentsScheduled: 0,
  appointmentsCompleted: 0,
  appointmentsCancelled: 0,
  appointmentsCompletionRate: 0,
  activeAlerts: 0,
  criticalAlerts: 0,
  avgAdherence: 0,
  patientAdherenceList: [],
  appointmentsByMonth: [],
  alertsByType: [],
};

export const useDoctorKPIs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["doctor_kpis", user?.id],
    queryFn: async (): Promise<DoctorKPIs> => {
      const { data, error } = await supabase.rpc("get_doctor_kpis", {
        _doctor_id: user!.id,
      });

      if (error) {
        console.error("Error fetching doctor KPIs:", error);
        return EMPTY_KPIS;
      }

      const raw = data as Record<string, any>;

      return {
        totalPatients: raw.totalPatients ?? 0,
        appointmentsScheduled: raw.appointmentsScheduled ?? 0,
        appointmentsCompleted: raw.appointmentsCompleted ?? 0,
        appointmentsCancelled: raw.appointmentsCancelled ?? 0,
        appointmentsCompletionRate: raw.appointmentsCompletionRate ?? 0,
        activeAlerts: raw.activeAlerts ?? 0,
        criticalAlerts: raw.criticalAlerts ?? 0,
        avgAdherence: raw.avgAdherence ?? 0,
        patientAdherenceList: raw.patientAdherenceList ?? [],
        appointmentsByMonth: raw.appointmentsByMonth ?? [],
        alertsByType: raw.alertsByType ?? [],
      };
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
  });
};
