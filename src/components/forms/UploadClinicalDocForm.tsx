import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUploadClinicalDocument } from "@/hooks/useMedicalHistory";
import { toast } from "sonner";

const UploadClinicalDocForm = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadClinicalDocument();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    upload.mutate(
      { file, description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Documento cargado exitosamente");
          setDescription("");
          setFile(null);
          if (fileRef.current) fileRef.current.value = "";
          setOpen(false);
        },
        onError: () => toast.error("Error al cargar el documento"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-primary">
          <Upload className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cargar Historia Clínica (PDF)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Archivo PDF *</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Historia clínica 2025" />
          </div>
          <Button type="submit" className="w-full" disabled={upload.isPending}>
            {upload.isPending ? "Cargando..." : "Cargar Documento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadClinicalDocForm;
