import { useMemo } from "react";
import { motion } from "framer-motion";
import { Pill, Calendar, Activity, TrendingUp } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PatientWithProfile } from "@/hooks/useDoctorData";
import type { Tables } from "@/integrations/supabase/types";

/* ─── Types ─── */
interface AdherenceData {
  medAdherence: number | null;
  appointmentAdherence: number | null;
  vitalsAdherence: number | null;
  overallScore: number | null;
  weeklyMedData: { day: string; pct: number }[];
}

/* ─── Calculate adherence from patient data ─── */
function calcAdherence(
  medications: Tables<"medications">[],
  medLogs: Tables<"medication_logs">[],
  appointments: Tables<"appointments">[],
  bpReadings: Tables<"blood_pressure_readings">[],
  glucoseReadings: Tables<"glucose_readings">[],
  weightRecords: Tables<"weight_records">[],
): AdherenceData {
  // --- Med adherence (last 7 days) ---
  const now = new Date();
  const activeMeds = medications.filter((m) => m.active);
  const weeklyMedData: { day: string; pct: number }[] = [];
  let totalExpected = 0;
  let totalTaken = 0;

  for (let d = 6; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    const dayLabel = date.toLocaleDateString("es", { weekday: "short" }).slice(0, 2);

    const expected = activeMeds.reduce((sum, m) => sum + (m.times?.length ?? 0), 0);
    const taken = medLogs.filter(
      (l) => l.log_date === dateStr && l.taken_at,
    ).length;

    totalExpected += expected;
    totalTaken += taken;
    weeklyMedData.push({
      day: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
      pct: expected > 0 ? Math.round((taken / expected) * 100) : 0,
    });
  }

  const medAdherence =
    totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : null;

  // --- Appointment adherence (last 30 days) ---
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentApts = appointments.filter(
    (a) => new Date(a.appointment_date) >= thirtyDaysAgo && new Date(a.appointment_date) <= now,
  );
  const completedApts = recentApts.filter((a) => a.status === "completed").length;
  const totalApts = recentApts.filter((a) => a.status !== "rescheduled").length;
  const appointmentAdherence =
    totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : null;

  // --- Vitals adherence (last 7 days — did they record something each day?) ---
  let vitalsRecordedDays = 0;
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    const hasBP = bpReadings.some((r) => r.measurement_time?.startsWith(dateStr));
    const hasGlucose = glucoseReadings.some((r) => r.measurement_time?.startsWith(dateStr));
    const hasWeight = weightRecords.some((r) => r.measurement_date === dateStr);

    if (hasBP || hasGlucose || hasWeight) vitalsRecordedDays++;
  }
  const vitalsAdherence = Math.round((vitalsRecordedDays / 7) * 100);

  // --- Overall score (weighted avg) ---
  const scores: number[] = [];
  const weights: number[] = [];
  if (medAdherence !== null) { scores.push(medAdherence); weights.push(0.5); }
  if (appointmentAdherence !== null) { scores.push(appointmentAdherence); weights.push(0.3); }
  scores.push(vitalsAdherence); weights.push(0.2);

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s, i) => sum + s * weights[i], 0) / totalWeight)
      : null;

  return { medAdherence, appointmentAdherence, vitalsAdherence, overallScore, weeklyMedData };
}

/* ─── Score Color Helper ─── */
function scoreColor(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 80) return "text-success";
  if (pct >= 50) return "text-warning";
  return "text-destructive";
}

function scoreBg(pct: number | null): string {
  if (pct === null) return "bg-muted";
  if (pct >= 80) return "bg-success/10";
  if (pct >= 50) return "bg-warning/10";
  return "bg-destructive/10";
}

function scoreLabel(pct: number | null): string {
  if (pct === null) return "Sin datos";
  if (pct >= 80) return "Excelente";
  if (pct >= 50) return "Regular";
  return "Baja";
}

/* ─── Component ─── */
export function AdherencePanel({
  patient,
}: {
  patient: PatientWithProfile;
}) {
  const data = useMemo(
    () =>
      calcAdherence(
        patient.medications ?? [],
        patient.medLogs ?? [],
        patient.appointments ?? [],
        patient.bpReadings ?? [],
        patient.glucoseReadings ?? [],
        patient.weightRecords ?? [],
      ),
    [patient],
  );

  const radialData = [
    { name: "Adherencia", value: data.overallScore ?? 0, fill: "hsl(var(--primary))" },
  ];

  const metrics = [
    {
      icon: Pill,
      label: "Medicamentos",
      value: data.medAdherence,
      sublabel: "Últimos 7 días",
    },
    {
      icon: Calendar,
      label: "Citas",
      value: data.appointmentAdherence,
      sublabel: "Últimos 30 días",
    },
    {
      icon: Activity,
      label: "Signos vitales",
      value: data.vitalsAdherence,
      sublabel: "Registro semanal",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Overall Score */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Adherencia General</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                data={radialData}
                barSize={10}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={5}
                  background={{ fill: "hsl(var(--muted))" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <p className={`text-4xl font-bold ${scoreColor(data.overallScore)}`}>
              {data.overallScore !== null ? `${data.overallScore}%` : "—"}
            </p>
            <p className={`text-sm font-medium ${scoreColor(data.overallScore)}`}>
              {scoreLabel(data.overallScore)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Score ponderado</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`${scoreBg(m.value)} rounded-xl p-3 text-center`}
          >
            <m.icon className={`w-4 h-4 mx-auto mb-1 ${scoreColor(m.value)}`} />
            <p className={`text-lg font-bold ${scoreColor(m.value)}`}>
              {m.value !== null ? `${m.value}%` : "—"}
            </p>
            <p className="text-[10px] font-medium text-foreground">{m.label}</p>
            <p className="text-[9px] text-muted-foreground">{m.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Weekly Medication Chart */}
      {data.medAdherence !== null && (
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-xs font-semibold text-foreground mb-3">
            Adherencia Medicamentos — Últimos 7 días
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.weeklyMedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Adherencia"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="pct"
                radius={[4, 4, 0, 0]}
                fill="hsl(var(--primary))"
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Compact version for patient dashboard ─── */
export function AdherenceCompact({
  medications,
  medLogs,
  appointments,
  bpReadings,
  glucoseReadings,
  weightRecords,
}: {
  medications: Tables<"medications">[];
  medLogs: Tables<"medication_logs">[];
  appointments: Tables<"appointments">[];
  bpReadings: Tables<"blood_pressure_readings">[];
  glucoseReadings: Tables<"glucose_readings">[];
  weightRecords: Tables<"weight_records">[];
}) {
  const data = useMemo(
    () => calcAdherence(medications, medLogs, appointments, bpReadings, glucoseReadings, weightRecords),
    [medications, medLogs, appointments, bpReadings, glucoseReadings, weightRecords],
  );

  const metrics = [
    { icon: Pill, label: "Medicamentos", value: data.medAdherence },
    { icon: Calendar, label: "Citas", value: data.appointmentAdherence },
    { icon: Activity, label: "Signos", value: data.vitalsAdherence },
    { icon: TrendingUp, label: "General", value: data.overallScore },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        Mi Adherencia
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className={`${scoreBg(m.value)} rounded-xl p-2 text-center`}>
            <m.icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${scoreColor(m.value)}`} />
            <p className={`text-sm font-bold ${scoreColor(m.value)}`}>
              {m.value !== null ? `${m.value}%` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
