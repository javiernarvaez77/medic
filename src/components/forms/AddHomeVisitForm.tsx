import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAddHomeVisit } from "@/hooks/useMedicalHistory";
import { toast } from "sonner";

const AddHomeVisitForm = () => {
  const [open, setOpen] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [reason, setReason] = useState("");
  const [observations, setObservations] = useState("");
  const addVisit = useAddHomeVisit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitDate) return;
    addVisit.mutate(
      {
        visitor_name: visitorName.trim(),
        visit_date: visitDate,
        reason: reason.trim() || undefined,
        observations: observations.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Visita domiciliaria registrada");
          setVisitorName("");
          setVisitDate("");
          setReason("");
          setObservations("");
          setOpen(false);
        },
        onError: () => toast.error("Error al registrar la visita"),
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
          <DialogTitle>Registrar Visita Domiciliaria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre del visitante *</Label>
            <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Dr. García" required />
          </div>
          <div>
            <Label>Fecha de visita *</Label>
            <Input type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Control de rutina" />
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Notas de la visita..." rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={addVisit.isPending}>
            {addVisit.isPending ? "Guardando..." : "Registrar Visita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHomeVisitForm;
