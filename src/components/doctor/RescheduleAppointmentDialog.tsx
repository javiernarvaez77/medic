import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRescheduleAppointment, useDoctorAppointments } from "@/hooks/useDoctorData";
import { useProfile } from "@/hooks/usePatientData";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const MODALITIES = [
  { value: "centro_salud", label: "Centro de Salud" },
  { value: "domiciliaria", label: "Domiciliaria" },
  { value: "telemedicina", label: "Telemedicina" },
  { value: "laboratorio", label: "Laboratorio Clínico" },
];

const TIME_SLOTS: string[] = [];
{
  let h = 7, m = 0;
  while (h < 17 || (h === 17 && m === 0)) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 40;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  appointment: Tables<"appointments">;
  patientName: string;
}

const RescheduleAppointmentDialog = ({ open, onClose, appointment, patientName }: Props) => {
  const { data: profile } = useProfile();
  const { data: allAppointments } = useDoctorAppointments();
  const reschedule = useRescheduleAppointment();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [modality, setModality] = useState((appointment as any).modality ?? "centro_salud");
  const [location, setLocation] = useState(appointment.location ?? "");

  const isSlotOccupied = (slot: string) => {
    if (!date) return false;
    const [sh, sm] = slot.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + 40;
    return (allAppointments ?? []).some((a) => {
      if (a.status === "cancelled" || a.id === appointment.id) return false;
      const aptDate = new Date(a.appointment_date);
      if (aptDate.toISOString().split("T")[0] !== date) return false;
      const aptStart = aptDate.getHours() * 60 + aptDate.getMinutes();
      const aptEnd = aptStart + 40;
      return slotStart < aptEnd && slotEnd > aptStart;
    });
  };

  const availableSlots = TIME_SLOTS.filter((s) => !isSlotOccupied(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Selecciona nueva fecha y hora");
      return;
    }
    const ips = (profile as any)?.ips ?? null;
    reschedule.mutate(
      {
        appointmentId: appointment.id,
        newDate: new Date(`${date}T${time}`).toISOString(),
        newModality: modality,
        newLocation: location.trim() || null,
        newIps: (modality === "centro_salud" || modality === "laboratorio") ? ips : null,
      },
      {
        onSuccess: () => {
          toast.success("Cita reprogramada");
          onClose();
        },
        onError: () => toast.error("Error al reprogramar"),
      }
    );
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reprogramar Cita - {patientName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nueva Fecha *</Label>
            <Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="mt-1" />
          </div>

          {date && (
            <div>
              <Label>Hora disponible * <span className="text-xs text-muted-foreground">(bloques de 40 min)</span></Label>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-destructive mt-1">No hay horarios disponibles</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                        time === slot
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-accent"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Modalidad</Label>
            <Select value={modality} onValueChange={setModality}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {modality === "centro_salud" ? "Consultorio / Ubicación"
                : modality === "laboratorio" ? "Laboratorio / Ubicación"
                : modality === "telemedicina" ? "Enlace o indicaciones"
                : "Dirección / Indicaciones"}
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1"
              maxLength={300}
            />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={reschedule.isPending}>
            {reschedule.isPending ? "Reprogramando..." : "Reprogramar Cita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleAppointmentDialog;