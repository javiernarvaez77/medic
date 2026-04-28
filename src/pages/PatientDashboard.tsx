import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Building2, Heart, Droplets, Calendar, FileText, Bell } from "lucide-react";
import { useProfile, useMedications, useTodayMedLogs, useAppointments, useUnreadDocuments } from "@/hooks/usePatientData";
import HeroMedAlert from "@/components/patient/HeroMedAlert";
import MedCard from "@/components/patient/MedCard";
import { AppointmentCard, AppointmentEmpty } from "@/components/patient/AppointmentCard";
import SOSButton from "@/components/SOSButton";
import VitalsSummaryCard from "@/components/patient/VitalsSummaryCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PROGRAM_LABELS: Record<string, string> = {
  riesgo_cardiovascular: "Riesgo Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Enfermedad Renal",
  enfermedad_respiratoria: "Enfermedad Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const PatientDashboard = () => {
  const { data: profile } = useProfile();
  const { data: medications } = useMedications();
  const { data: medLogs } = useTodayMedLogs();
  const { data: appointments } = useAppointments();
  const { data: unreadCount } = useUnreadDocuments();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Usuario";
  const now = new Date();

  const calcAge = (dob: string) => {
    const birth = new Date(dob);
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };
  const age = profile?.date_of_birth ? calcAge(profile.date_of_birth) : null;

  const todayDoses = (medications ?? []).flatMap((med) =>
    med.times.map((time) => {
      const taken = (medLogs ?? []).some(
        (log) => log.medication_id === med.id && log.scheduled_time === time && log.taken_at
      );
      const [hh, mm] = time.split(":").map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hh, mm, 0, 0);
      const isPending = !taken && scheduledDate <= now;
      const isFuture = !taken && scheduledDate > now;
      return { med, time, taken, isPending, isFuture, scheduledDate };
    })
  ).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  const nextPendingDose = todayDoses.find((d) => d.isPending);

  const nextAppointment = (appointments ?? []).find(
    (a) => new Date(a.appointment_date) >= now && a.status === "scheduled"
  );

  const dayName = format(now, "EEEE", { locale: es });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-base text-muted-foreground font-medium uppercase tracking-wider">
            {capitalizedDay}
          </p>
          <h1 className="text-[32px] font-extrabold text-foreground mt-1">
            Hola, {firstName}
          </h1>
        </div>
        <Link
          to="/perfil"
          className="w-[60px] h-[60px] rounded-full bg-accent border-2 border-accent flex items-center justify-center text-3xl"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
          ) : (
            <span>👤</span>
          )}
        </Link>
      </div>

      {/* Patient info badges */}
      <div className="flex gap-2 flex-wrap mb-6">
        {profile?.eps && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            {profile.eps}
          </span>
        )}
        {(profile?.programs ?? []).filter((p: string) => p !== "otro").map((prog: string) => (
          <span key={prog} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold">
            <Heart className="w-3.5 h-3.5" />
            {PROGRAM_LABELS[prog] ?? prog}
          </span>
        ))}
        {age !== null && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {age} años
          </span>
        )}
        {profile?.blood_type && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emergency/10 text-emergency rounded-xl text-xs font-semibold">
            <Droplets className="w-3.5 h-3.5" />
            {profile.blood_type}
          </span>
        )}
      </div>

      {/* Unread Documents Notification */}
      {(unreadCount ?? 0) > 0 && (
        <Link to="/perfil" className="block mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-accent border border-primary/20 rounded-2xl"
          >
            <div className="relative">
              <FileText className="w-5 h-5 text-primary" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {unreadCount === 1 ? "Nuevo documento clínico" : `${unreadCount} nuevos documentos clínicos`}
              </p>
              <p className="text-xs text-muted-foreground">Tu médico ha subido archivos. Toca para ver.</p>
            </div>
            <Bell className="w-4 h-4 text-primary animate-pulse" />
          </motion.div>
        </Link>
      )}

      {/* Hero Alert */}
      {nextPendingDose && (
        <div className="mb-8">
          <HeroMedAlert medication={nextPendingDose.med} time={nextPendingDose.time} />
        </div>
      )}

      {/* Today's Medications */}
      {todayDoses.length > 0 && (
        <>
          <h2 className="text-[22px] font-bold text-foreground mb-4 mt-8">
            Tus medicinas de hoy
          </h2>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {todayDoses.map(({ med, time, taken, isPending, isFuture }) => (
              <MedCard
                key={`${med.id}-${time}`}
                time={time}
                name={med.name}
                dose={med.dose}
                taken={taken}
                pending={isPending || isFuture}
              />
            ))}
          </motion.div>
        </>
      )}

      {/* Next Appointment */}
      <h2 className="text-[22px] font-bold text-foreground mb-4 mt-8">
        Próxima cita médica
      </h2>
      {nextAppointment ? (
        <AppointmentCard appointment={nextAppointment} />
      ) : (
        <AppointmentEmpty />
      )}

      {/* Profile Link */}
      <Link
        to="/perfil"
        className="flex items-center justify-center gap-2 mt-6 py-4 bg-accent text-primary rounded-2xl text-center font-bold text-lg"
      >
        <User className="w-5 h-5" />
        Ver mi Perfil Médico
      </Link>

      {/* Vital Signs Summary */}
      <VitalsSummaryCard />

      <SOSButton />
    </div>
  );
};

export default PatientDashboard;
