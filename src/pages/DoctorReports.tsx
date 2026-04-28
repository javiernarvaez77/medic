import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3, Download, Users, CalendarCheck, CalendarX, CalendarClock,
  Pill, TrendingUp, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RANGES = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "6 meses", value: 180 },
  { label: "12 meses", value: 365 },
];

const PROGRAM_LABELS: Record<string, string> = {
  riesgo_cardiovascular: "Riesgo Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Enfermedad Renal",
  enfermedad_respiratoria: "Enf. Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

interface ReportData {
  rangeDays: number;
  totalPatients: number;
  appointments: {
    scheduled: number; completed: number; cancelled: number; rescheduled: number;
    total: number; completionRate: number; cancellationRate: number; rescheduleRate: number;
  };
  avgAdherence: number;
  adherenceByPatient: Array<{
    patientId: string; name: string; programs: string[];
    expected: number; taken: number; adherence: number;
  }>;
  medsByProgram: Array<{
    program: string; patients: number; expected: number; taken: number; adherence: number;
  }>;
}

const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const DoctorReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-reports", user?.id, days],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_doctor_reports" as any, {
        _doctor_id: user!.id,
        _days: days,
      });
      if (error) throw error;
      return data as unknown as ReportData;
    },
  });

  const exportAppointments = () => {
    if (!data) return;
    const a = data.appointments;
    downloadCSV(`citas_${days}d.csv`, [
      ["Métrica", "Cantidad", "Porcentaje"],
      ["Programadas", a.scheduled, ""],
      ["Cumplidas", a.completed, `${a.completionRate}%`],
      ["Canceladas", a.cancelled, `${a.cancellationRate}%`],
      ["Aplazadas", a.rescheduled, `${a.rescheduleRate}%`],
      ["Total", a.total, "100%"],
    ]);
  };

  const exportAdherence = () => {
    if (!data) return;
    downloadCSV(`adherencia_pacientes_${days}d.csv`, [
      ["Paciente", "Programas", "Tomas esperadas", "Tomas registradas", "Adherencia (%)"],
      ...data.adherenceByPatient.map(p => [
        p.name,
        p.programs.map(pr => PROGRAM_LABELS[pr] ?? pr).join(" / "),
        p.expected, p.taken, p.adherence,
      ]),
    ]);
  };

  const exportProgramMeds = () => {
    if (!data) return;
    downloadCSV(`medicamentos_por_programa_${days}d.csv`, [
      ["Programa", "Pacientes", "Tomas esperadas", "Tomas registradas", "Adherencia (%)"],
      ...data.medsByProgram.map(p => [
        PROGRAM_LABELS[p.program] ?? p.program,
        p.patients, p.expected, p.taken, p.adherence,
      ]),
    ]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reportes</h1>
            <p className="text-xs text-muted-foreground">Estadísticas clínicas y de adherencia</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                days === r.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5">
        {isLoading && <p className="text-center text-muted-foreground py-8">Cargando reportes...</p>}

        {data && (
          <>
            {/* Resumen */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl p-3 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Pacientes</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{data.totalPatients}</p>
                </div>
                <div className="bg-card rounded-2xl p-3 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Adherencia prom.</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{data.avgAdherence}%</p>
                </div>
              </div>
            </motion.section>

            {/* Citas */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-primary" /> Citas
                </h2>
                <button onClick={exportAppointments} className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <KpiCard icon={<CalendarClock className="w-4 h-4" />} label="Programadas" value={data.appointments.scheduled} tone="primary" />
                <KpiCard icon={<CalendarCheck className="w-4 h-4" />} label="Cumplidas" value={data.appointments.completed} pct={data.appointments.completionRate} tone="emerald" />
                <KpiCard icon={<CalendarX className="w-4 h-4" />} label="Canceladas" value={data.appointments.cancelled} pct={data.appointments.cancellationRate} tone="destructive" />
                <KpiCard icon={<CalendarClock className="w-4 h-4" />} label="Aplazadas" value={data.appointments.rescheduled} pct={data.appointments.rescheduleRate} tone="amber" />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Total en periodo: <span className="font-semibold text-foreground">{data.appointments.total}</span>
              </p>
            </motion.section>

            {/* Medicamentos por programa */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" /> Medicamentos por programa
                </h2>
                <button
                  onClick={exportProgramMeds}
                  disabled={data.medsByProgram.length === 0}
                  className="flex items-center gap-1 text-xs text-primary font-medium disabled:opacity-40"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              {data.medsByProgram.length > 0 ? (
                <div className="space-y-2">
                  {data.medsByProgram.map(p => (
                    <div key={p.program} className="bg-card rounded-xl p-3 shadow-card">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground">{PROGRAM_LABELS[p.program] ?? p.program}</p>
                        <span className={`text-sm font-bold ${
                          p.adherence >= 80 ? "text-emerald-500" : p.adherence >= 50 ? "text-amber-500" : "text-destructive"
                        }`}>{p.adherence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full ${
                            p.adherence >= 80 ? "bg-emerald-500" : p.adherence >= 50 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${p.adherence}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.patients} paciente{p.patients !== 1 ? "s" : ""} · {p.taken}/{p.expected} tomas
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 bg-card rounded-xl">
                  Sin pacientes con programa crónico asignado.
                </p>
              )}
            </motion.section>

            {/* Adherencia por paciente */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Adherencia por paciente
                </h2>
                <button
                  onClick={exportAdherence}
                  disabled={data.adherenceByPatient.length === 0}
                  className="flex items-center gap-1 text-xs text-primary font-medium disabled:opacity-40"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              {data.adherenceByPatient.length > 0 ? (
                <div className="space-y-2">
                  {data.adherenceByPatient.map(p => (
                    <div key={p.patientId} className="bg-card rounded-xl p-3 shadow-card">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <span className={`text-sm font-bold ml-2 ${
                          p.adherence >= 80 ? "text-emerald-500" : p.adherence >= 50 ? "text-amber-500" : "text-destructive"
                        }`}>{p.adherence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full ${
                            p.adherence >= 80 ? "bg-emerald-500" : p.adherence >= 50 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${p.adherence}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.taken}/{p.expected} tomas
                        {p.programs.length > 0 && ` · ${p.programs.map(pr => PROGRAM_LABELS[pr] ?? pr).join(", ")}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 bg-card rounded-xl">
                  Sin pacientes con medicamentos activos.
                </p>
              )}
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, pct, tone }: {
  icon: React.ReactNode; label: string; value: number; pct?: number;
  tone: "primary" | "emerald" | "destructive" | "amber";
}) => {
  const toneMap = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    destructive: "text-destructive bg-destructive/10",
    amber: "text-amber-500 bg-amber-500/10",
  };
  return (
    <div className="bg-card rounded-2xl p-3 shadow-card">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${toneMap[tone]}`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-xl font-bold text-foreground">{value}</p>
        {pct !== undefined && <span className="text-xs text-muted-foreground">({pct}%)</span>}
      </div>
    </div>
  );
};

export default DoctorReports;
