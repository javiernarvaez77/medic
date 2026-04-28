import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddAllergy } from "@/hooks/usePatientData";
import { toast } from "sonner";

const SEVERITIES = [
  { value: "mild", label: "Leve" },
  { value: "moderate", label: "Moderada" },
  { value: "severe", label: "Severa" },
];

const AddAllergyForm = () => {
  const [open, setOpen] = useState(false);
  const addAllergy = useAddAllergy();
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre de la alergia es obligatorio");
      return;
    }
    addAllergy.mutate(
      { name: name.trim(), severity, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Alergia agregada");
          setName("");
          setSeverity("moderate");
          setNotes("");
          setOpen(false);
        },
        onError: () => toast.error("Error al agregar alergia"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg bg-emergency/10 hover:bg-emergency/20 transition-colors">
          <Plus className="w-4 h-4 text-emergency" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar Alergia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Penicilina" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Severidad</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1" maxLength={200} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addAllergy.isPending}>
            {addAllergy.isPending ? "Guardando..." : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAllergyForm;
