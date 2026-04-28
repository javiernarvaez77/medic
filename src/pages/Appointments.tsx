import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, User, Home, Video, Building2, Beaker } from "lucide-react";
import { useAppointments } from "@/hooks/usePatientData";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MODALITY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  centro_salud: { label: "Centro de Salud", icon: Building2 },
  domiciliaria: { label: "Domiciliaria", icon: Home },
  telemedicina: { label: "Telemedicina", icon: Video },
  laboratorio: { label: "Laboratorio Clínico", icon: Beaker },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const Appointments = () => {
  const { data: appointments, isLoading } = useAppointments();

  const now = new Date();
  const upcoming = (appointments ?? []).filter(
    (a) => new Date(a.appointment_date) >= now && a.status !== "cancelled" && a.status !== "completed"
  );
  const past = (appointments ?? []).filter(
    (a) => new Date(a.appointment_date) < now || a.status === "completed" || a.status === "cancelled"
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return { label: "Atendida", className: "bg-success/10 text-success" };
      case "cancelled":
        return { label: "Cancelada", className: "bg-destructive/10 text-destructive" };
      case "rescheduled":
        return { label: "Reprogramada", className: "bg-warning/10 text-warning" };
      default:
        return { label: "Confirmada", className: "bg-success/10 text-success" };
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mis Citas</h1>
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-lg font-semibold text-foreground mb-3">Próximas Citas</h2>
        {upcoming.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 shadow-card text-center mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tienes citas próximas</p>
            <p className="text-xs text-muted-foreground mt-1">Tu profesional de salud agendará tus citas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => {
              const mod = MODALITY_LABELS[(apt as any).modality ?? "centro_salud"] ?? MODALITY_LABELS.centro_salud;
              const ModIcon = mod.icon;
              return (
                <motion.div
                  key={apt.id}
                  variants={item}
                  className="bg-card rounded-2xl p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {apt.doctor_name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(apt.status).className}`}>
                          {getStatusBadge(apt.status).label}
                        </span>
                      </div>
                      {apt.specialty && (
                        <p className="text-xs text-muted-foreground mb-2">{apt.specialty}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(apt.appointment_date), "EEE d MMM • h:mm a", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ModIcon className="w-3.5 h-3.5" />
                          {mod.label}
                        </span>
                        {apt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {apt.location}
                          </span>
                        )}
                      </div>
                      {(apt as any).ips && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          {(apt as any).ips}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {past.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 mb-4"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Historial</h2>
          <div className="space-y-2">
            {past.map((apt) => {
              const badge = getStatusBadge(apt.status);
              return (
                <div
                  key={apt.id}
                  className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3 opacity-70"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{apt.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.appointment_date), "EEE d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Appointments;
