import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAddWeight } from "@/hooks/useVitalSigns";
import { toast } from "sonner";

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-amber-600", alert: true };
  if (bmi < 25) return { label: "Normal", color: "text-green-600", alert: false };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-amber-600", alert: true };
  if (bmi < 35) return { label: "Obesidad I", color: "text-orange-600", alert: true };
  if (bmi < 40) return { label: "Obesidad II", color: "text-destructive", alert: true };
  return { label: "Obesidad III", color: "text-destructive", alert: true };
};

const AddWeightForm = () => {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");
  const addWeight = useAddWeight();

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const bmi = !isNaN(weightNum) && !isNaN(heightNum) && heightNum > 0
    ? weightNum / ((heightNum / 100) * (heightNum / 100))
    : null;
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(weightNum) || isNaN(heightNum)) return;

    addWeight.mutate(
      { weight_kg: weightNum, height_cm: heightNum, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Peso registrado");
          setWeight(""); setHeight(""); setNotes("");
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
          <DialogTitle>Registrar Peso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peso (kg) *</Label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" required />
            </div>
            <div>
              <Label>Estatura (cm) *</Label>
              <Input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" required />
            </div>
          </div>

          {bmi !== null && bmiInfo && (
            <div className={`p-3 rounded-xl border ${bmiInfo.alert ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-sm font-semibold text-foreground">
                IMC: <span className={bmiInfo.color}>{bmi.toFixed(1)}</span>
              </p>
              <p className={`text-xs font-medium ${bmiInfo.color}`}>{bmiInfo.label}</p>
              {bmiInfo.alert && (
                <p className="text-xs text-muted-foreground mt-1">
                  {bmi < 18.5 && "⚠️ Tu peso está por debajo de lo recomendado. Consulta con tu médico."}
                  {bmi >= 25 && bmi < 30 && "⚠️ Sobrepeso detectado. Se recomienda actividad física y dieta balanceada."}
                  {bmi >= 30 && "🚨 Obesidad detectada. Consulta con tu médico para un plan de manejo."}
                </p>
              )}
            </div>
          )}

          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          </div>
          <Button type="submit" className="w-full" disabled={addWeight.isPending}>
            {addWeight.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWeightForm;
export { getBMICategory };
