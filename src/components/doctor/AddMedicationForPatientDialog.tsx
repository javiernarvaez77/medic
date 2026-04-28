import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FREQUENCIES = [
  { label: "Cada 8 horas", hours: 8 },
  { label: "Cada 12 horas", hours: 12 },
  { label: "Cada 24 horas", hours: 24 },
  { label: "Una vez al día", hours: 24 },
  { label: "Dos veces al día", hours: 12 },
  { label: "Tres veces al día", hours: 8 },
];

function generateTimes(startTime: string, frequencyLabel: string): string[] {
  const freq = FREQUENCIES.find((f) => f.label === frequencyLabel);
  if (!freq) return [startTime];

  const dosesPerDay = Math.floor(24 / freq.hours);
  const [h, m] = startTime.split(":").map(Number);
  const times: string[] = [];

  for (let i = 0; i < dosesPerDay; i++) {
    const totalH = (h + i * freq.hours) % 24;
    times.push(`${String(totalH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  return times;
}

interface Props {
  patientId: string;
  patientName: string;
}

const AddMedicationForPatientDialog = ({ patientId, patientName }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [condition, setCondition] = useState("");
  const [instructions, setInstructions] = useState("");
  const qc = useQueryClient();

  const addMed = useMutation({
    mutationFn: async (med: { name: string; dose: string; frequency: string; condition: string | null; instructions: string | null; times: string[]; user_id: string }) => {
      const { error } = await supabase.from("medications").insert(med);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_detail"] });
      qc.invalidateQueries({ queryKey: ["medications"] });
    },
  });

  const calculatedTimes = frequency ? generateTimes(startTime, frequency) : [];

  const reset = () => {
    setName(""); setDose(""); setFrequency(""); setStartTime("08:00"); setCondition(""); setInstructions("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim() || !frequency) {
      toast.error("Completa nombre, dosis y frecuencia");
      return;
    }
    addMed.mutate(
      {
        name: name.trim(),
        dose: dose.trim(),
        frequency,
        condition: condition.trim() || null,
        instructions: instructions.trim() || null,
        times: calculatedTimes,
        user_id: patientId,
      },
      {
        onSuccess: () => { toast.success("Medicamento agregado al paciente"); reset(); setOpen(false); },
        onError: () => toast.error("Error al agregar medicamento"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Agregar Medicamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Medicamento para {patientName}</DialogTitle>
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
                {FREQUENCIES.map((f) => <SelectItem key={f.label} value={f.label}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Hora de primera toma</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
          </div>
          {calculatedTimes.length > 0 && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Horarios calculados:</p>
              <div className="flex flex-wrap gap-2">
                {calculatedTimes.map((t) => (
                  <span key={t} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-lg">{t}</span>
                ))}
              </div>
            </div>
          )}
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

export default AddMedicationForPatientDialog;
