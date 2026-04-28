import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Star, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CIE10_CODES, type CIE10Entry } from "@/data/cie10-codes";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAX_CONDITIONS = 3;

interface Props {
  patientId: string;
  patientName: string;
  currentConditionsCount: number;
  hasPrimary: boolean;
}

const AddConditionForPatientDialog = ({ patientId, patientName, currentConditionsCount, hasPrimary }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cie10Code, setCie10Code] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [diagnosedDate, setDiagnosedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPrimary, setIsPrimary] = useState(!hasPrimary);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCodes = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const term = searchTerm.toLowerCase();
    return CIE10_CODES.filter(
      (c) => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    ).slice(0, 15);
  }, [searchTerm]);

  if (currentConditionsCount >= MAX_CONDITIONS) return null;

  const selectCode = (entry: CIE10Entry) => {
    setCie10Code(entry.code);
    setName(entry.name);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre del diagnóstico es obligatorio");
      return;
    }

    setLoading(true);
    try {
      if (isPrimary) {
        await supabase
          .from("patient_conditions")
          .update({ is_primary: false })
          .eq("user_id", patientId);
      }

      const { error } = await supabase.from("patient_conditions").insert({
        user_id: patientId,
        name: name.trim(),
        cie10_code: cie10Code.trim().toUpperCase() || null,
        diagnosed_date: diagnosedDate || null,
        notes: notes.trim() || null,
        is_primary: isPrimary,
      } as any);
      if (error) throw error;

      toast.success("Diagnóstico agregado");
      qc.invalidateQueries({ queryKey: ["patient_detail", patientId] });
      qc.invalidateQueries({ queryKey: ["conditions"] });
      setName("");
      setCie10Code("");
      setSearchTerm("");
      setDiagnosedDate("");
      setNotes("");
      setOpen(false);
    } catch {
      toast.error("Error al agregar diagnóstico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
          <Plus className="w-4 h-4 text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Agregar Diagnóstico ({currentConditionsCount}/{MAX_CONDITIONS})</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Paciente: {patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* CIE-10 search */}
          <div className="relative">
            <Label>Buscar por Código CIE-10 o Nombre</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => searchTerm.length >= 1 && setShowDropdown(true)}
                placeholder="Escriba código o nombre... Ej: I10 o Hipertensión"
                className="pl-8 font-mono"
              />
            </div>
            {showDropdown && filteredCodes.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                <ScrollArea className="max-h-48">
                  {filteredCodes.map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      onClick={() => selectCode(entry)}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                    >
                      <span className="font-mono text-xs font-bold text-primary">{entry.code}</span>
                      <span className="text-xs text-muted-foreground mx-1.5">—</span>
                      <span className="text-xs text-foreground">{entry.name}</span>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
            {showDropdown && searchTerm.length >= 1 && filteredCodes.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3">
                <p className="text-xs text-muted-foreground text-center">No se encontraron resultados. Puede escribir manualmente.</p>
              </div>
            )}
          </div>

          {/* Selected code display */}
          {cie10Code && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="font-mono text-sm font-bold text-primary">{cie10Code}</span>
              <span className="text-xs text-muted-foreground">—</span>
              <span className="text-sm text-foreground flex-1">{name}</span>
              <button
                type="button"
                onClick={() => { setCie10Code(""); setName(""); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Manual name fallback (only if no code selected) */}
          {!cie10Code && (
            <div>
              <Label>Nombre del Diagnóstico *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="O escriba el nombre manualmente" className="mt-1" maxLength={100} />
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
          <div className="flex items-center gap-2">
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
            {!hasPrimary && (
              <span className="text-[10px] text-destructive font-medium">* Obligatorio</span>
            )}
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading || (!hasPrimary && !isPrimary)}>
            {loading ? "Guardando..." : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConditionForPatientDialog;
