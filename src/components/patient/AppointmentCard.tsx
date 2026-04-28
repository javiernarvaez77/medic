import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

interface AppointmentCardProps {
  appointment: {
    appointment_date: string;
    doctor_name: string;
    specialty?: string | null;
    location?: string | null;
  };
}

const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  const date = new Date(appointment.appointment_date);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-card flex gap-5">
      <div className="w-[70px] h-[70px] rounded-2xl bg-accent text-primary flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold uppercase">
          {format(date, "MMM", { locale: es })}
        </span>
        <span className="text-2xl font-extrabold leading-none">
          {format(date, "dd")}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-xl font-extrabold text-foreground mb-1">
          {format(date, "h:mm a")}
        </p>
        <p className="text-lg text-muted-foreground leading-snug">
          <strong className="text-foreground">{appointment.doctor_name}</strong>
          {appointment.specialty && <><br />{appointment.specialty}</>}
          {appointment.location && <><br />{appointment.location}</>}
        </p>
      </div>
    </div>
  );
};

const AppointmentEmpty = () => (
  <div className="bg-card rounded-3xl p-6 shadow-card text-center">
    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
    <p className="text-lg text-muted-foreground">No tienes citas próximas</p>
    <Link to="/citas" className="text-base text-primary font-bold mt-2 inline-block">
      Ver citas
    </Link>
  </div>
);

export { AppointmentCard, AppointmentEmpty };
