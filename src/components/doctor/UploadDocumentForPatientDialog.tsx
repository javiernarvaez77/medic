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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  patientId: string;
  patientName: string;
}

const UploadDocumentForPatientDialog = ({ patientId, patientName }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setLoading(true);

    try {
      const filePath = `${patientId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("clinical-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("clinical-documents")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("clinical_documents").insert({
        user_id: patientId,
        doctor_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        description: description.trim() || null,
        read_by_patient: false,
      } as any);
      if (error) throw error;

      toast.success("Documento cargado exitosamente");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["patient_detail", patientId] });
      qc.invalidateQueries({ queryKey: ["clinical_documents"] });
      qc.invalidateQueries({ queryKey: ["unread_documents"] });
    } catch (err: any) {
      toast.error("Error al cargar: " + (err.message ?? "Intente de nuevo"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Cargar Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cargar documento para {patientName.split(" ")[0]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Archivo (PDF, imagen, etc.) *</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.dicom"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Historia clínica, Rx tórax, Hemograma..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cargando..." : "Cargar Documento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentForPatientDialog;
