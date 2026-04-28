import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, LogOut, CheckCircle2, Pill,
  TrendingUp, AlertTriangle, BarChart3, ChevronDown, ChevronRight,
  Heart, Droplets, Weight, TrendingDown, Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useClinicalAlerts } from "@/hooks/useClinicalAlerts";
import { useDoctorKPIs } from "@/hooks/useDoctorKPIs";
import { useDoctorPatients, useDoctorAppointments } from "@/hooks/useDoctorData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/usePatientData";
import PatientsByProgramSection from "@/components/doctor/PatientsByProgramSection";
import kronicLogo from "@/assets/logo.jpg";

const PROFESSION_LABELS: Record<string, string> = {
  medico: "Médico",
  enfermera: "Enfermera",
  odontologo: "Odontólogo",
  auxiliar_enfermeria: "Aux. Enfermería",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning, 38 92% 50%))",
];

const ALERT_ICON_MAP: Record<string, React.ElementType> = {
  heart: Heart,
  droplets: Droplets,
  weight: Weight,
  pill: Pill,
  "trending-down": TrendingDown,
};

type SectionId = "patients" | "appointments" | "alerts" | "stats" | null;

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: clinicalAlerts } = useClinicalAlerts();
  const { data: kpis, isLoading: kpisLoading } = useDoctorKPIs();
  const { data: patients } = useDoctorPatients();
  const { data: appointments } = useDoctorAppointments();

  const [openSection, setOpenSection] = useState<SectionId>(null);

  const toggle = (id: SectionId) =>
    setOpenSection((cur) => (cur === id ? null : id));

  const profession = (profile as any)?.profession;
  const professionLabel = profession ? PROFESSION_LABELS[profession] ?? profession : "Profesional de la Salud";

  const alerts = clinicalAlerts ?? [];
  const criticalAlertsCount = alerts.filter((a) => a.severity === "critical").length;

  // Upcoming appointments
  const now = Date.now();
  const upcoming = (appointments ?? [])
    .filter((a) => a.status === "scheduled" && new Date(a.appointment_date).getTime() >= now)
    .slice(0, 5);

  const appointmentPieData = kpis
    ? [
        { name: "Atendidas", value: kpis.appointmentsCompleted },
        { name: "Canceladas", value: kpis.appointmentsCancelled },
        { name: "Pendientes", value: kpis.appointmentsScheduled },
      ].filter((d) => d.value > 0)
    : [];

  const sections: {
    id: SectionId;
    label: string;
    value: number | string;
    sub: string;
    icon: React.ElementType;
    bg: string;
    iconColor: string;
    badge?: string;
  }[] = [
    {
      id: "patients",
      label: "Pacientes",
      value: kpis?.totalPatients ?? 0,
      sub: "asignados",
      icon: Users,
      bg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      id: "appointments",
      label: "Citas",
      value: kpis?.appointmentsScheduled ?? 0,
      sub: "pendientes",
      icon: Calendar,
      bg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      id: "alerts",
      label: "Alertas Médicas",
      value: kpis?.activeAlerts ?? alerts.length,
      sub: criticalAlertsCount > 0 ? `${criticalAlertsCount} críticas` : "activas",
      icon: AlertTriangle,
      bg: "bg-destructive/10",
      iconColor: "text-destructive",
      badge: criticalAlertsCount > 0 ? "!" : undefined,
    },
    {
      id: "stats",
      label: "Estadísticas",
      value: `${kpis?.appointmentsCompletionRate ?? 0}%`,
      sub: "datos analíticos",
      icon: BarChart3,
      bg: "bg-success/10",
      iconColor: "text-success",
    },
  ];

  return (
    <div className="px-4 pt-6 pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src={kronicLogo} alt="Kronic" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{professionLabel}</p>
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name ?? "Profesional"}</h1>
            {(profile as any)?.ips && (
              <p className="text-xs text-muted-foreground mt-0.5">📍 {(profile as any).ips}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/reportes")}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
            title="Reportes"
            aria-label="Reportes"
          >
            <BarChart3 className="w-5 h-5 text-primary" />
          </button>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Big icon section cards */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map((s, i) => {
          const Icon = s.icon;
          const isOpen = openSection === s.id;
          return (
            <motion.button
              key={s.id}
              onClick={() => toggle(s.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-card rounded-2xl p-4 shadow-card text-left transition-all active:scale-[0.97] ${
                isOpen ? "ring-2 ring-primary/40" : ""
              }`}
              aria-expanded={isOpen}
              aria-controls={`section-${s.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                {s.badge && (
                  <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              <div className="absolute bottom-2 right-2 text-muted-foreground">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Patients by Chronic Program (moved from profile) */}
      <PatientsByProgramSection />

      {/* Expandable content */}
      <AnimatePresence mode="wait">
        {openSection && (
          <motion.div
            key={openSection}
            id={`section-${openSection}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl p-4 shadow-card">
              {/* PATIENTS */}
              {openSection === "patients" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Pacientes asignados
                    </h2>
                    <button
                      onClick={() => navigate("/pacientes")}
                      className="text-xs font-semibold text-primary"
                    >
                      Ver todos →
                    </button>
                  </div>
                  {(patients ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">No tienes pacientes asignados aún.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {(patients ?? []).slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/pacientes?patient=${p.user_id}`)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted active:scale-[0.98] transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {p.full_name?.charAt(0).toUpperCase() ?? "P"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{p.full_name}</p>
                            {p.document_id && (
                              <p className="text-[11px] text-muted-foreground">CC {p.document_id}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* APPOINTMENTS */}
              {openSection === "appointments" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-secondary" />
                      Próximas citas
                    </h2>
                    <button
                      onClick={() => navigate("/agenda")}
                      className="text-xs font-semibold text-primary"
                    >
                      Ver agenda →
                    </button>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">No hay citas próximas.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((a) => {
                        const d = new Date(a.appointment_date);
                        return (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40"
                          >
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex flex-col items-center justify-center">
                              <span className="text-[9px] uppercase text-secondary font-bold leading-none">
                                {d.toLocaleString("es-CO", { month: "short" })}
                              </span>
                              <span className="text-base font-bold text-secondary leading-tight">
                                {d.getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {a.specialty ?? "Consulta"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                {a.modality && ` · ${a.modality}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ALERTS */}
              {openSection === "alerts" && (
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Alertas clínicas ({alerts.length})
                  </h2>
                  {alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">
                      ✅ No hay alertas activas. Todo en orden.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {alerts.map((alert) => {
                        const Icon = ALERT_ICON_MAP[alert.iconType] ?? AlertTriangle;
                        const critical = alert.severity === "critical";
                        return (
                          <div
                            key={alert.id}
                            className={`flex items-center gap-3 rounded-xl p-3 ${
                              critical
                                ? "bg-destructive/10 border border-destructive/20"
                                : "bg-warning/10 border border-warning/20"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                critical ? "bg-destructive/20" : "bg-warning/20"
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${critical ? "text-destructive" : "text-warning"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {alert.patient}
                              </p>
                              <p
                                className={`text-xs ${
                                  critical ? "text-destructive" : "text-warning"
                                }`}
                              >
                                {alert.message}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                critical
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-warning text-warning-foreground"
                              }`}
                            >
                              {critical ? "CRÍTICO" : "ALERTA"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STATS */}
              {openSection === "stats" && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-success" />
                    Estadísticas
                  </h2>

                  {/* Adherence */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Pill className="w-4 h-4 text-primary" />
                        Adherencia (7 días)
                      </span>
                      <span className={`text-base font-bold ${(kpis?.avgAdherence ?? 0) >= 80 ? "text-success" : (kpis?.avgAdherence ?? 0) >= 50 ? "text-warning" : "text-destructive"}`}>
                        {kpis?.avgAdherence ?? 0}%
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      <Progress value={kpis?.avgAdherence ?? 0} className="h-3" />
                      {(kpis?.patientAdherenceList ?? []).length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {kpis!.patientAdherenceList.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground truncate w-24">
                                {p.name.split(" ")[0]}
                              </span>
                              <div className="flex-1">
                                <Progress value={p.adherence} className="h-2" />
                              </div>
                              <span
                                className={`text-xs font-semibold w-10 text-right ${
                                  p.adherence >= 80
                                    ? "text-success"
                                    : p.adherence >= 50
                                    ? "text-warning"
                                    : "text-destructive"
                                }`}
                              >
                                {p.adherence}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Appointments by month */}
                  {(kpis?.appointmentsByMonth ?? []).some((m) => m.completed + m.cancelled + m.scheduled > 0) && (
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Citas por mes
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Atendidas</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Canceladas</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--warning, 38 92% 50%))" }} /> Pendientes</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={kpis!.appointmentsByMonth} barSize={12}>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={20} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 12,
                                fontSize: 11,
                              }}
                            />
                            <Bar dataKey="completed" name="Atendidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cancelled" name="Canceladas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="scheduled" name="Pendientes" fill="hsl(var(--warning, 38 92% 50%))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Distribution */}
                  {appointmentPieData.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Activity className="w-4 h-4 text-primary" />
                          Distribución de citas
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie
                              data={appointmentPieData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={55}
                              innerRadius={28}
                              strokeWidth={0}
                            >
                              {appointmentPieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                                fontSize: 11,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                          {appointmentPieData.map((d, i) => (
                            <span key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[i] }}
                              />
                              {d.name} ({d.value})
                            </span>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Alerts by type */}
                  {(kpis?.alertsByType ?? []).length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          Alertas por tipo
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 space-y-2">
                        {kpis!.alertsByType.map((a) => (
                          <div key={a.type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <span className="text-sm text-foreground">{a.type}</span>
                            <span className="text-xs font-bold bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                              {a.count}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Completion rate summary */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Tasa de cumplimiento de citas</p>
                      <p className="text-lg font-bold text-success">
                        {kpis?.appointmentsCompletionRate ?? 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {kpisLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
