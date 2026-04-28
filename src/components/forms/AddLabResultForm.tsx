import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAddLabResult } from "@/hooks/usePatientData";
import { toast } from "sonner";

const AddLabResultForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [normalRange, setNormalRange] = useState("");
  const [resultDate, setResultDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const addLab = useAddLabResult();

  const reset = () => {
    setName(""); setValue(""); setUnit(""); setNormalRange(""); setResultDate(new Date().toISOString().split("T")[0]); setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !resultDate) {
      toast.error("Completa nombre y fecha del examen");
      return;
    }
    addLab.mutate(
      {
        name: name.trim(),
        value: value ? parseFloat(value) : null,
        unit: unit.trim() || null,
        normal_range: normalRange.trim() || null,
        result_date: resultDate,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Resultado agregado"); reset(); setOpen(false); },
        onError: () => toast.error("Error al agregar resultado"),
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
          <DialogTitle>Nuevo Resultado de Laboratorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre del Examen *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hemoglobina Glicosilada" className="mt-1" maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor</Label>
              <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ej: 6.5" className="mt-1" />
            </div>
            <div>
              <Label>Unidad</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: %" className="mt-1" maxLength={20} />
            </div>
          </div>
          <div>
            <Label>Rango Normal</Label>
            <Input value={normalRange} onChange={(e) => setNormalRange(e.target.value)} placeholder="Ej: 4.0 - 5.6" className="mt-1" maxLength={50} />
          </div>
          <div>
            <Label>Fecha del Examen *</Label>
            <Input type="date" value={resultDate} onChange={(e) => setResultDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones adicionales" className="mt-1" maxLength={300} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addLab.isPending}>
            {addLab.isPending ? "Guardando..." : "Guardar Resultado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLabResultForm;
