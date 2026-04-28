import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAddCondition, useConditions } from "@/hooks/usePatientData";
import { toast } from "sonner";

const MAX_CONDITIONS = 3;

const AddConditionForm = () => {
  const [open, setOpen] = useState(false);
  const addCondition = useAddCondition();
  const { data: conditions } = useConditions();
  const [name, setName] = useState("");
  const [diagnosedDate, setDiagnosedDate] = useState("");
  const [notes, setNotes] = useState("");

  const conditionCount = (conditions ?? []).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre del diagnóstico es obligatorio");
      return;
    }
    if (conditionCount >= MAX_CONDITIONS) {
      toast.error("Máximo 3 diagnósticos permitidos");
      return;
    }
    addCondition.mutate(
      { name: name.trim(), diagnosed_date: diagnosedDate || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Diagnóstico agregado");
          setName("");
          setDiagnosedDate("");
          setNotes("");
          setOpen(false);
        },
        onError: () => toast.error("Error al agregar diagnóstico"),
      }
    );
  };

  if (conditionCount >= MAX_CONDITIONS) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
          <Plus className="w-4 h-4 text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar Diagnóstico ({conditionCount}/{MAX_CONDITIONS})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hipertensión arterial" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Fecha de Diagnóstico</Label>
            <Input type="date" value={diagnosedDate} onChange={(e) => setDiagnosedDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1" maxLength={200} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addCondition.isPending}>
            {addCondition.isPending ? "Guardando..." : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConditionForm;
