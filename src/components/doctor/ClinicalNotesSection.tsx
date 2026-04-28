import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Trash2, Send, Filter } from "lucide-react";
import { useClinicalNotes, useAddClinicalNote, useDeleteClinicalNote } from "@/hooks/useDoctorData";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "evolucion", label: "Evolución", color: "bg-primary/10 text-primary" },
  { value: "interconsulta", label: "Interconsulta", color: "bg-secondary/10 text-secondary" },
  { value: "plan_manejo", label: "Plan de Manejo", color: "bg-info/10 text-info" },
  { value: "educacion", label: "Educación", color: "bg-success/10 text-success" },
  { value: "otro", label: "Otro", color: "bg-muted text-muted-foreground" },
] as const;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, { label: c.label, color: c.color }])
);

const ClinicalNotesSection = ({ patientId }: { patientId: string }) => {
  const { data: notes, isLoading } = useClinicalNotes(patientId);
  const addNote = useAddClinicalNote();
  const deleteNote = useDeleteClinicalNote();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("evolucion");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleSubmit = () => {
    if (!content.trim()) return;
    addNote.mutate(
      { patientId, content: content.trim(), category },
      {
        onSuccess: () => {
          setContent("");
          setShowForm(false);
          toast.success("Nota clínica agregada");
        },
        onError: () => toast.error("Error al agregar nota"),
      }
    );
  };

  const handleDelete = (noteId: string) => {
    deleteNote.mutate(
      { noteId, patientId },
      {
        onSuccess: () => toast.success("Nota eliminada"),
        onError: () => toast.error("Error al eliminar nota"),
      }
    );
  };

  const filteredNotes = (notes ?? []).filter(
    (n) => filterCategory === "all" || n.category === filterCategory
  );

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Notas Clínicas</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-card rounded-xl p-3 shadow-card">
              {/* Category selector */}
              <div className="flex gap-1.5 flex-wrap mb-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      category === c.value
                        ? `${c.color} ring-2 ring-offset-1 ring-primary/30`
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe una nota clínica..."
                rows={3}
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || addNote.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {addNote.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter chips */}
      {(notes ?? []).length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              filterCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Todas
          </button>
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                filterCategory === c.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="bg-card rounded-xl px-4 py-4 shadow-card text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-card rounded-xl px-4 py-4 shadow-card text-center">
            <p className="text-xs text-muted-foreground">
              {(notes ?? []).length === 0
                ? "Sin notas clínicas. Agrega la primera."
                : "Sin notas en esta categoría."}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const cat = CATEGORY_MAP[note.category] ?? CATEGORY_MAP.otro;
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl px-4 py-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1.5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {format(new Date(note.created_at), "d MMM yyyy • h:mm a", { locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClinicalNotesSection;
