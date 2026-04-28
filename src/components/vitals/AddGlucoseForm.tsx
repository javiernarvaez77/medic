import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAddGlucose } from "@/hooks/useVitalSigns";
import { toast } from "sonner";

const MEAL_CONTEXT_LABELS: Record<string, string> = {
  before_meal: "Antes de comer",
  after_meal: "Después de comer",
  fasting: "En ayunas",
  other: "Otro",
};

const AddGlucoseForm = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [mealContext, setMealContext] = useState("before_meal");
  const [mealType, setMealType] = useState("");
  const [notes, setNotes] = useState("");
  const addGlucose = useAddGlucose();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val)) return;

    addGlucose.mutate(
      { value: val, meal_context: mealContext, meal_type: mealType.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Glucosa registrada");
          setValue(""); setMealContext("before_meal"); setMealType(""); setNotes("");
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
          <DialogTitle>Registrar Glucosa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Valor (mg/dL) *</Label>
            <Input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="100" required />
          </div>
          <div>
            <Label>Momento *</Label>
            <Select value={mealContext} onValueChange={setMealContext}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEAL_CONTEXT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(mealContext === "before_meal" || mealContext === "after_meal") && (
            <div>
              <Label>Comida</Label>
              <Input value={mealType} onChange={(e) => setMealType(e.target.value)} placeholder="Desayuno, almuerzo, cena..." />
            </div>
          )}
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          </div>
          <Button type="submit" className="w-full" disabled={addGlucose.isPending}>
            {addGlucose.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGlucoseForm;
