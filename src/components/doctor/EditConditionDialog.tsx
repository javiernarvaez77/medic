import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CIE10_CODES, type CIE10Entry } from "@/data/cie10-codes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  condition: {
    id: string;
    user_id: string;
    name: string;
    cie10_code?: string | null;
    diagnosed_date?: string | null;
    notes?: string | null;
    is_primary: boolean;
  };
  patientId: string;
}

const EditConditionDialog = ({ condition, patientId }: Props) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(condition.name);
  const [cie10Code, setCie10Code] = useState(condition.cie10_code ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [diagnosedDate, setDiagnosedDate] = useState(condition.diagnosed_date ?? "");
  const [notes, setNotes] = useState(condition.notes ?? "");
  const [isPrimary, setIsPrimary] = useState(condition.is_primary);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const filteredCodes = searchTerm.length >= 1
    ? CIE10_CODES.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10)
    : [];

  const selectCode = (entry: CIE10Entry) => {
    setCie10Code(entry.code);
    setName(entry.name);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    try {
      if (isPrimary && !condition.is_primary) {
        await supabase
          .from("patient_conditions")
          .update({ is_primary: false })
          .eq("user_id", patientId);
      }
      const { error } = await supabase
        .from("patient_conditions")
        .update({
          name: name.trim(),
          cie10_code: cie10Code.trim().toUpperCase() || null,
          diagnosed_date: diagnosedDate || null,
          notes: notes.trim() || null,
          is_primary: isPrimary,
        } as any)
        .eq("id", condition.id);
      if (error) throw error;
      toast.success("Diagnóstico actualizado");
      qc.invalidateQueries({ queryKey: ["patient_detail", patientId] });
      qc.invalidateQueries({ queryKey: ["conditions"] });
      setOpen(false);
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("patient_conditions")
        .delete()
        .eq("id", condition.id);
      if (error) throw error;
      toast.success("Diagnóstico eliminado");
      qc.invalidateQueries({ queryKey: ["patient_detail", patientId] });
      qc.invalidateQueries({ queryKey: ["conditions"] });
      setOpen(false);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-md hover:bg-muted transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmDelete(false); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Diagnóstico</DialogTitle>
          </DialogHeader>

          {confirmDelete ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-foreground">
                ¿Está seguro de eliminar el diagnóstico <strong>{condition.name}</strong>?
              </p>
              <p className="text-xs text-destructive">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading}>
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {/* CIE-10 search */}
              <div className="relative">
                <Label>Buscar CIE-10</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => searchTerm.length >= 1 && setShowDropdown(true)}
                    placeholder="Buscar código o nombre..."
                    className="pl-8 font-mono text-sm"
                  />
                </div>
                {showDropdown && filteredCodes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    <ScrollArea className="max-h-40">
                      {filteredCodes.map((entry) => (
                        <button
                          key={entry.code}
                          type="button"
                          onClick={() => selectCode(entry)}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                        >
                          <span className="font-mono text-xs font-bold text-primary">{entry.code}</span>
                          <span className="text-xs text-muted-foreground mx-1">—</span>
                          <span className="text-xs text-foreground">{entry.name}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Current code */}
              {cie10Code && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="font-mono text-sm font-bold text-primary">{cie10Code}</span>
                  <span className="text-xs text-muted-foreground">—</span>
                  <span className="text-sm text-foreground flex-1">{name}</span>
                  <button type="button" onClick={() => { setCie10Code(""); setName(""); }} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                </div>
              )}

              {!cie10Code && (
                <div>
                  <Label>Nombre del Diagnóstico *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" maxLength={100} />
                </div>
              )}

              <div>
                <Label>Fecha de Diagnóstico</Label>
                <Input type="date" value={diagnosedDate} onChange={(e) => setDiagnosedDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1" maxLength={200} />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setIsPrimary(!isPrimary)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isPrimary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isPrimary ? "fill-primary-foreground" : ""}`} />
                  {isPrimary ? "Diagnóstico Principal" : "Marcar como Principal"}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  onClick={handleUpdate}
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditConditionDialog;
