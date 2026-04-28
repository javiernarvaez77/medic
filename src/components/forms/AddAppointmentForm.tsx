import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAddAppointment } from "@/hooks/usePatientData";
import { toast } from "sonner";

const AddAppointmentForm = () => {
  const [open, setOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const addApt = useAddAppointment();

  const reset = () => {
    setDoctorName(""); setSpecialty(""); setDate(""); setTime(""); setLocation(""); setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !date || !time) {
      toast.error("Completa doctor, fecha y hora");
      return;
    }
    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    addApt.mutate(
      { doctor_name: doctorName.trim(), specialty: specialty.trim() || null, appointment_date: appointmentDate, location: location.trim() || null, notes: notes.trim() || null },
      {
        onSuccess: () => { toast.success("Cita agendada"); reset(); setOpen(false); },
        onError: () => toast.error("Error al agendar cita"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cita Médica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre del Doctor *</Label>
            <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Ej: Dr. García" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Especialidad</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Cardiología" className="mt-1" maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Hora *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Clínica del Norte, Cons. 305" className="mt-1" maxLength={200} />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Llevar exámenes previos" className="mt-1" maxLength={300} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addApt.isPending}>
            {addApt.isPending ? "Guardando..." : "Agendar Cita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentForm;
