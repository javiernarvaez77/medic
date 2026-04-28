import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAddEmergencyContact } from "@/hooks/usePatientData";
import { toast } from "sonner";

const AddEmergencyContactForm = () => {
  const [open, setOpen] = useState(false);
  const addContact = useAddEmergencyContact();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }
    addContact.mutate(
      { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Contacto agregado");
          setName("");
          setPhone("");
          setRelationship("");
          setOpen(false);
        },
        onError: () => toast.error("Error al agregar contacto"),
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
          <DialogTitle>Agregar Contacto de Emergencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: María García" className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Teléfono *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 3001234567" className="mt-1" maxLength={15} />
          </div>
          <div>
            <Label>Parentesco</Label>
            <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Ej: Esposa, Hijo, Madre" className="mt-1" maxLength={50} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={addContact.isPending}>
            {addContact.isPending ? "Guardando..." : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmergencyContactForm;
