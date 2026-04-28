import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddDoctorAppointment, useDoctorAppointments } from "@/hooks/useDoctorData";
import { useProfile } from "@/hooks/usePatientData";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const MODALITIES = [
  { value: "centro_salud", label: "Centro de Salud" },
  { value: "domiciliaria", label: "Domiciliaria" },
  { value: "telemedicina", label: "Telemedicina" },
  { value: "laboratorio", label: "Laboratorio Clínico" },
];

// Generate 40-min time slots from 7:00 to 17:00
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
  patient: Tables<"profiles">;
}

const ScheduleAppointmentDialog = ({ open, onClose, patient }: Props) => {
  const { data: profile } = useProfile();
  const { data: allAppointments } = useDoctorAppointments();
  const addAppointment = useAddDoctorAppointment();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [modality, setModality] = useState("centro_salud");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Get occupied slots for the selected date
  const occupiedSlots = (allAppointments ?? [])
    .filter((a) => {
      if (!date) return false;
      const aptDate = new Date(a.appointment_date).toISOString().split("T")[0];
      return aptDate === date && a.status !== "cancelled";
    })
    .map((a) => {
      const d = new Date(a.appointment_date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    });

  // Check if slot conflicts (40-min window)
  const isSlotOccupied = (slot: string) => {
    if (!date) return false;
    const [sh, sm] = slot.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + 40;

    return (allAppointments ?? []).some((a) => {
      if (a.status === "cancelled") return false;
      const aptDate = new Date(a.appointment_date);
      if (aptDate.toISOString().split("T")[0] !== date) return false;
      const aptStart = aptDate.getHours() * 60 + aptDate.getMinutes();
      const aptEnd = aptStart + 40;
      return slotStart < aptEnd && slotEnd > aptStart;
    });
  };

  const availableSlots = TIME_SLOTS.filter((s) => !isSlotOccupied(s));

  const reset = () => {
    setDate(""); setTime(""); setModality("centro_salud"); setLocation(""); setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Selecciona fecha y hora");
      return;
    }

    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    const doctorName = profile?.full_name ?? "Profesional";
    const ips = (profile as any)?.ips ?? null;
    const profession = (profile as any)?.profession;
    const PROFESSION_LABELS: Record<string, string> = {
      medico: "Médico",
      enfermera: "Enfermera",
      odontologo: "Odontólogo",
      auxiliar_enfermeria: "Auxiliar de Enfermería",
    };
    const specialty = profession ? PROFESSION_LABELS[profession] ?? profession : null;

    addAppointment.mutate(
      {
        user_id: patient.user_id,
        doctor_name: doctorName,
        specialty,
        appointment_date: appointmentDate,
        location: modality === "domiciliaria" ? ((patient as any).address ?? location.trim()) || null : location.trim() || null,
        notes: notes.trim() || null,
        modality,
        ips: (modality === "centro_salud" || modality === "laboratorio") ? ips : null,
      },
      {
        onSuccess: () => {
          toast.success(`Cita agendada para ${patient.full_name}`);
          reset();
          onClose();
        },
        onError: () => toast.error("Error al agendar cita"),
      }
    );
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Cita - {patient.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Fecha *</Label>
            <Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="mt-1" />
          </div>

          {date && (
            <div>
              <Label>Hora disponible * <span className="text-xs text-muted-foreground">(bloques de 40 min)</span></Label>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-destructive mt-1">No hay horarios disponibles para esta fecha</p>
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
            <Label>Modalidad *</Label>
            <Select value={modality} onValueChange={setModality}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(modality === "centro_salud" || modality === "laboratorio") && (profile as any)?.ips && (
            <div className="px-3 py-2 bg-muted rounded-xl text-xs text-muted-foreground">
              {modality === "laboratorio" ? "🔬" : "🏥"} IPS: {(profile as any).ips}
            </div>
          )}

          {modality === "domiciliaria" && (patient as any)?.address && (
            <div className="px-3 py-2 bg-muted rounded-xl text-xs text-muted-foreground">
              🏠 Dirección del paciente: {(patient as any).address}
            </div>
          )}

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
              placeholder={
                modality === "telemedicina" ? "Ej: https://meet.google.com/..."
                  : modality === "laboratorio" ? "Ej: Laboratorio piso 2"
                  : "Ej: Consultorio 305"
              }
              className="mt-1"
              maxLength={300}
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones para el paciente" className="mt-1" maxLength={300} />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={addAppointment.isPending}>
            {addAppointment.isPending ? "Agendando..." : "Agendar Cita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleAppointmentDialog;
