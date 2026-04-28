import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAddBloodPressure } from "@/hooks/useVitalSigns";
import { toast } from "sonner";

const AddBloodPressureForm = () => {
  const [open, setOpen] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");
  const addBP = useAddBloodPressure();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (isNaN(sys) || isNaN(dia)) return;

    addBP.mutate(
      { systolic: sys, diastolic: dia, pulse: pulse ? parseInt(pulse) : undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Presión arterial registrada");
          setSystolic(""); setDiastolic(""); setPulse(""); setNotes("");
          setOpen(false);
        },
        onError: () => toast.error("Error al registrar"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-primary">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Presión Arterial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sistólica (mmHg) *</Label>
              <Input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="120" required />
            </div>
            <div>
              <Label>Diastólica (mmHg) *</Label>
              <Input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="80" required />
            </div>
          </div>
          <div>
            <Label>Pulso (lpm)</Label>
            <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="72" />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          </div>
          <Button type="submit" className="w-full" disabled={addBP.isPending}>
            {addBP.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBloodPressureForm;
