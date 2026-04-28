import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useAddMedication } from "@/hooks/usePatientData";
import { toast } from "sonner";

const FREQUENCIES = ["Cada 8 horas", "Cada 12 horas", "Cada 24 horas", "Una vez al día", "Dos veces al día", "Tres veces al día"];

const AddMedicationForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [condition, setCondition] = useState("");
  const [instructions, setInstructions] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const addMed = useAddMedication();

  const addTime = () => setTimes([...times, "12:00"]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, val: string) => {
    const copy = [...times];
    copy[i] = val;
    setTimes(copy);
  };

  const reset = () => {
    setName(""); setDose(""); setFrequency(""); setCondition(""); setInstructions(""); setTimes(["08:00"]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim() || !frequency) {
      toast.error("Completa nombre, dosis y frecuencia");
      return;
    }
    addMed.mutate(
      { name: name.trim(), dose: dose.trim(), frequency, condition: condition.trim() || null, instructions: instructions.trim() || null, times },
      {
        onSuccess: () => { toast.success("Medicamento agregado"); reset(); setOpen(false); },
        onError: () => toast.error("Error al agregar medicamento"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Medicamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Metformina" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Dosis *</Label>
            <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Ej: 500mg" className="mt-1" maxLength={50} />
          </div>
          <div>
            <Label>Frecuencia *</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Horarios</Label>
            <div className="space-y-2 mt-1">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} className="flex-1" />
                  {times.length > 1 && (
                    <button type="button" onClick={() => removeTime(i)} className="p-1.5 rounded-lg hover:bg-muted">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addTime} className="w-full rounded-xl">
                + Agregar horario
              </Button>
            </div>
          </div>
          <div>
            <Label>Condición / Diagnóstico</Label>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Ej: Diabetes tipo 2" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Instrucciones</Label>
            <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ej: Tomar con alimentos" className="mt-1" maxLength={200} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addMed.isPending}>
            {addMed.isPending ? "Guardando..." : "Guardar Medicamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicationForm;
