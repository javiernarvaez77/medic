import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Building2, Home, Video, Beaker, X, RefreshCw, CheckCircle2,
} from "lucide-react";
import RescheduleAppointmentDialog from "@/components/doctor/RescheduleAppointmentDialog";
import { useDoctorPatients, useDoctorAppointments, useCancelAppointment, useCompleteAppointment } from "@/hooks/useDoctorData";
import type { Tables } from "@/integrations/supabase/types";
import { format, isSameDay, parseISO, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const MODALITY_ICONS: Record<string, React.ElementType> = {
  centro_salud: Building2,
  domiciliaria: Home,
  telemedicina: Video,
  laboratorio: Beaker,
};

const MODALITY_LABELS: Record<string, string> = {
  centro_salud: "Centro de Salud",
  domiciliaria: "Domiciliaria",
  telemedicina: "Telemedicina",
  laboratorio: "Laboratorio Clínico",
};

const DoctorAgenda = () => {
  const { data: patients } = useDoctorPatients();
  const { data: doctorAppointments } = useDoctorAppointments();
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [rescheduleApt, setRescheduleApt] = useState<Tables<"appointments"> | null>(null);

  const getPatientName = (userId: string) => {
    const p = (patients ?? []).find((pat) => pat.user_id === userId);
    return p?.full_name ?? "Paciente";
  };

  const dayAppointments = (doctorAppointments ?? []).filter((a) =>
    isSameDay(parseISO(a.appointment_date), calendarDate) && a.status !== "cancelled"
  ).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const weekStart = startOfWeek(calendarDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold text-foreground mb-4">Agenda</h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Mini week calendar */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, calendarDate);
            const hasAppts = (doctorAppointments ?? []).some(
              (a) => isSameDay(parseISO(a.appointment_date), day) && a.status !== "cancelled"
            );
            return (
              <button
                key={day.toISOString()}
                onClick={() => setCalendarDate(day)}
                className={`flex-1 min-w-[48px] flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-foreground"
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {format(day, "EEE", { locale: es })}
                </span>
                <span className="text-lg font-bold">{format(day, "d")}</span>
                {hasAppts && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarDate(addDays(calendarDate, -7))}
            className="text-xs text-primary font-medium"
          >
            ← Semana anterior
          </button>
          <p className="text-sm font-semibold text-foreground">
            {format(calendarDate, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <button
            onClick={() => setCalendarDate(addDays(calendarDate, 7))}
            className="text-xs text-primary font-medium"
          >
            Semana siguiente →
          </button>
        </div>

        {/* Day appointments */}
        {dayAppointments.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 shadow-card text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin citas para este día</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayAppointments.map((apt) => {
              const mod = (apt as any).modality ?? "centro_salud";
              const ModIcon = MODALITY_ICONS[mod] ?? Building2;
              const isActive = apt.status === "scheduled" || apt.status === "rescheduled";
              return (
                <div key={apt.id} className="bg-card rounded-xl p-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center w-14">
                      <p className="text-sm font-bold text-primary">
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">40 min</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getPatientName(apt.user_id)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ModIcon className="w-3 h-3" />
                        <span>{MODALITY_LABELS[mod] ?? mod}</span>
                      </div>
                      {apt.location && (
                        <p className="text-[10px] text-muted-foreground truncate">{apt.location}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                      apt.status === "completed" ? "bg-success/10 text-success"
                        : apt.status === "rescheduled" ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {apt.status === "completed" ? "Atendido" : apt.status === "rescheduled" ? "↻" : "●"}
                    </span>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                      <button
                        onClick={() => {
                          if (confirm("¿Marcar como atendido?")) {
                            completeAppointment.mutate(apt.id);
                          }
                        }}
                        disabled={completeAppointment.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Atendido
                      </button>
                      <button
                        onClick={() => setRescheduleApt(apt)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Reprogramar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("¿Cancelar esta cita?")) {
                            cancelAppointment.mutate(apt.id);
                          }
                        }}
                        disabled={cancelAppointment.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {rescheduleApt && (
        <RescheduleAppointmentDialog
          open={!!rescheduleApt}
          onClose={() => setRescheduleApt(null)}
          appointment={rescheduleApt}
          patientName={getPatientName(rescheduleApt.user_id)}
        />
      )}
    </div>
  );
};

export default DoctorAgenda;
