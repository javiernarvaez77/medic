import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PatientAlert = {
  id: string;
  type: "vitals" | "medication" | "adherence";
  severity: "warning" | "critical";
  iconType: "heart" | "droplets" | "weight" | "pill" | "trending-down";
  patient: string;
  patientId: string;
  message: string;
};

const isBPOutOfRange = (s: number, d: number) => s >= 140 || s < 90 || d >= 90 || d < 60;
const isGlucoseOutOfRange = (v: number) => v > 180 || v < 70;
const isBMIOutOfRange = (b: number) => b >= 30 || b < 18.5;

export const useClinicalAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clinical_alerts", user?.id],
    queryFn: async () => {
      // Get assigned patients
      const { data: assignments } = await supabase
        .from("doctor_patients")
        .select("patient_id")
        .eq("doctor_id", user!.id);
      
      const patientIds = (assignments ?? []).map((a) => a.patient_id);
      if (patientIds.length === 0) return [];

      // Fetch profiles, latest vitals, and med logs in parallel
      const [profiles, bpReadings, glucoseReadings, weightRecords, medications, medLogs, appointments, bpAll, glucoseAll, weightAll] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", patientIds),
        supabase.from("blood_pressure_readings").select("user_id, systolic, diastolic, measurement_time").in("user_id", patientIds).order("measurement_time", { ascending: false }).limit(100),
        supabase.from("glucose_readings").select("user_id, value, measurement_time").in("user_id", patientIds).order("measurement_time", { ascending: false }).limit(100),
        supabase.from("weight_records").select("user_id, bmi, measurement_date").in("user_id", patientIds).order("measurement_date", { ascending: false }).limit(100),
        supabase.from("medications").select("id, user_id, times").in("user_id", patientIds).eq("active", true),
        (() => {
          const sevenAgo = new Date();
          sevenAgo.setDate(sevenAgo.getDate() - 7);
          return supabase.from("medication_logs").select("user_id, taken_at, log_date, medication_id").in("user_id", patientIds).gte("log_date", sevenAgo.toISOString().split("T")[0]);
        })(),
        (() => {
          const thirtyAgo = new Date();
          thirtyAgo.setDate(thirtyAgo.getDate() - 30);
          return supabase.from("appointments").select("user_id, status").in("user_id", patientIds).gte("appointment_date", thirtyAgo.toISOString());
        })(),
        (() => {
          const sevenAgo = new Date();
          sevenAgo.setDate(sevenAgo.getDate() - 7);
          return supabase.from("blood_pressure_readings").select("user_id, measurement_time").in("user_id", patientIds).gte("measurement_time", sevenAgo.toISOString());
        })(),
        (() => {
          const sevenAgo = new Date();
          sevenAgo.setDate(sevenAgo.getDate() - 7);
          return supabase.from("glucose_readings").select("user_id, measurement_time").in("user_id", patientIds).gte("measurement_time", sevenAgo.toISOString());
        })(),
        (() => {
          const sevenAgo = new Date();
          sevenAgo.setDate(sevenAgo.getDate() - 7);
          return supabase.from("weight_records").select("user_id, measurement_date").in("user_id", patientIds).gte("measurement_date", sevenAgo.toISOString().split("T")[0]);
        })(),
      ]);

      const nameMap = new Map((profiles.data ?? []).map((p) => [p.user_id, p.full_name]));
      const alerts: PatientAlert[] = [];
      const now = Date.now();

      for (const pid of patientIds) {
        const name = nameMap.get(pid) ?? "Paciente";

        // Latest BP
        const latestBP = (bpReadings.data ?? []).find((r) => r.user_id === pid);
        if (latestBP && isBPOutOfRange(latestBP.systolic, latestBP.diastolic)) {
          alerts.push({
            id: `bp-${pid}`,
            type: "vitals",
            severity: latestBP.systolic >= 160 || latestBP.diastolic >= 100 ? "critical" : "warning",
            iconType: "heart",
            patient: name,
            patientId: pid,
            message: `PA ${latestBP.systolic}/${latestBP.diastolic} mmHg fuera de rango`,
          });
        }

        // Latest glucose
        const latestGlucose = (glucoseReadings.data ?? []).find((r) => r.user_id === pid);
        if (latestGlucose) {
          const val = Number(latestGlucose.value);
          if (isGlucoseOutOfRange(val)) {
            alerts.push({
              id: `glucose-${pid}`,
              type: "vitals",
              severity: val > 250 || val < 54 ? "critical" : "warning",
              iconType: "droplets",
              patient: name,
              patientId: pid,
              message: `Glucosa ${val} mg/dL fuera de rango`,
            });
          }
        }

        // Latest BMI
        const latestWeight = (weightRecords.data ?? []).find((r) => r.user_id === pid);
        if (latestWeight?.bmi) {
          const bmi = Number(latestWeight.bmi);
          if (isBMIOutOfRange(bmi)) {
            alerts.push({
              id: `bmi-${pid}`,
              type: "vitals",
              severity: bmi >= 35 || bmi < 16 ? "critical" : "warning",
              iconType: "weight",
              patient: name,
              patientId: pid,
              message: `IMC ${bmi.toFixed(1)} fuera de rango`,
            });
          }
        }

        // Medication adherence - >24h without a taken log
        const patientMeds = (medications.data ?? []).filter((m) => m.user_id === pid);
        if (patientMeds.length > 0) {
          const patientLogs = (medLogs.data ?? []).filter((l) => l.user_id === pid);
          const hasRecentLog = patientLogs.some((log) => {
            if (!log.taken_at) return false;
            return now - new Date(log.taken_at).getTime() < 24 * 60 * 60 * 1000;
          });
          if (!hasRecentLog) {
            alerts.push({
              id: `meds-${pid}`,
              type: "medication",
              severity: "warning",
              iconType: "pill",
              patient: name,
              patientId: pid,
              message: "Sin registro de toma en las últimas 24h",
            });
          }
        }

        // Overall adherence score < 50% alert
        const calcAdherenceScore = () => {
          const scores: number[] = [];
          const weights: number[] = [];

          // Medication adherence (50% weight)
          if (patientMeds.length > 0) {
            const expectedPerDay = patientMeds.reduce((sum, m) => sum + ((m.times as string[])?.length ?? 0), 0);
            const expected7 = expectedPerDay * 7;
            const taken7 = (medLogs.data ?? []).filter((l) => l.user_id === pid && l.taken_at).length;
            scores.push(expected7 > 0 ? Math.min(100, Math.round((taken7 / expected7) * 100)) : 100);
            weights.push(50);
          }

          // Appointment adherence (30% weight)
          const ptAppts = (appointments.data ?? []).filter((a) => a.user_id === pid);
          if (ptAppts.length > 0) {
            const completed = ptAppts.filter((a) => a.status === "completed").length;
            scores.push(Math.round((completed / ptAppts.length) * 100));
            weights.push(30);
          }

          // Vital signs registration frequency (20% weight)
          const bpCount = (bpAll.data ?? []).filter((r) => r.user_id === pid).length;
          const glCount = (glucoseAll.data ?? []).filter((r) => r.user_id === pid).length;
          const wtCount = (weightAll.data ?? []).filter((r) => r.user_id === pid).length;
          const totalVitals = bpCount + glCount + wtCount;
          const vitalsScore = Math.min(100, Math.round((totalVitals / 7) * 100));
          scores.push(vitalsScore);
          weights.push(20);

          const totalWeight = weights.reduce((s, w) => s + w, 0);
          if (totalWeight === 0) return 100;
          return Math.round(scores.reduce((s, sc, i) => s + sc * weights[i], 0) / totalWeight);
        };

        const adherenceScore = calcAdherenceScore();
        if (adherenceScore < 50) {
          alerts.push({
            id: `adherence-${pid}`,
            type: "adherence",
            severity: adherenceScore < 25 ? "critical" : "warning",
            iconType: "trending-down",
            patient: name,
            patientId: pid,
            message: `Adherencia global ${adherenceScore}% — requiere atención`,
          });
        }
      }

      alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));
      return alerts;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });
};
