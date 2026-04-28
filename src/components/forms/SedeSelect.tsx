import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { useSedes } from "@/hooks/useSedes";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SedeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** If true, shows the inline "create sede" form for doctors */
  allowCreate?: boolean;
}

const SedeSelect = ({ value, onChange, className, allowCreate = false }: SedeSelectProps) => {
  const { data: sedes, isLoading } = useSedes();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSede, setNewSede] = useState({ nombre: "", municipio: "", departamento: "" });

  const inputClass =
    "w-full px-3 py-2 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  const handleCreate = async () => {
    if (!newSede.nombre.trim() || !newSede.municipio.trim() || !newSede.departamento.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await (supabase as any)
        .from("sedes")
        .insert({
          nombre: newSede.nombre.trim(),
          municipio: newSede.municipio.trim(),
          departamento: newSede.departamento.trim(),
        })
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Sede creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
      onChange(data.id);
      setShowCreate(false);
      setNewSede({ nombre: "", municipio: "", departamento: "" });
    } catch (err: any) {
      toast.error(err.message || "Error al crear sede");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || inputClass}
      >
        <option value="">Seleccionar sede...</option>
        {(sedes ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre} — {s.municipio}
          </option>
        ))}
      </select>

      {allowCreate && !showCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Crear nueva sede
        </button>
      )}

      {allowCreate && showCreate && (
        <div className="bg-muted/50 rounded-xl p-3 space-y-2 border border-border">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Nueva Sede
          </p>
          <input
            type="text"
            placeholder="Nombre de la sede"
            value={newSede.nombre}
            onChange={(e) => setNewSede((p) => ({ ...p, nombre: e.target.value }))}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Municipio"
              value={newSede.municipio}
              onChange={(e) => setNewSede((p) => ({ ...p, municipio: e.target.value }))}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Departamento"
              value={newSede.departamento}
              onChange={(e) => setNewSede((p) => ({ ...p, departamento: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNewSede({ nombre: "", municipio: "", departamento: "" }); }}
              className="px-3 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SedeSelect;
