import { useState } from "react";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

const PatientClinicalNotes = () => {
  const { user } = useAuth();
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["patient_clinical_notes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_notes")
        .select("id, content, created_at, doctor_id, category")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const doctorIds = [...new Set((data ?? []).map((n) => n.doctor_id))];
      if (doctorIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", doctorIds);

      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      return (data ?? []).map((n) => ({
        ...n,
        doctor_name: nameMap.get(n.doctor_id) ?? "Médico",
      }));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl px-4 py-4 shadow-card text-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!notes || notes.length === 0) return null;

  const filteredNotes = notes.filter(
    (n) => filterCategory === "all" || n.category === filterCategory
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <h2 className="text-lg font-semibold text-foreground">Notas de mi Médico</h2>
      </div>

      {/* Filter chips */}
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

      <div className="space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="bg-card rounded-xl px-4 py-4 shadow-card text-center">
            <p className="text-xs text-muted-foreground">Sin notas en esta categoría.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const cat = CATEGORY_MAP[note.category] ?? CATEGORY_MAP.otro;
            return (
              <div
                key={note.id}
                className="bg-card rounded-xl px-4 py-3 shadow-card"
              >
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1.5 ${cat.color}`}>
                  {cat.label}
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Dr. {note.doctor_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(note.created_at), "d MMM yyyy • h:mm a", { locale: es })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default PatientClinicalNotes;
