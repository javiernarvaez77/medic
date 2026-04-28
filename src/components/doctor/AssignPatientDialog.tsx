import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SearchResult {
  user_id: string;
  full_name: string;
  document_id: string | null;
  date_of_birth: string | null;
  programs: string[] | null;
  already_assigned: boolean;
}

const programLabels: Record<string, string> = {
  riesgo_cardiovascular: "Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Renal",
  enfermedad_respiratoria: "Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

export const AssignPatientDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      toast.error("Ingresa al menos 3 caracteres");
      return;
    }

    setSearching(true);
    setSearched(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Use fetch directly since invoke doesn't support query params well
      // Use fetch directly since invoke doesn't support query params well
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-patients?q=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al buscar");
      }

      const data = await res.json();
      setResults(data);
      setSearched(true);
    } catch (err: any) {
      toast.error(err.message || "Error al buscar pacientes");
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (patientId: string) => {
    if (!user) return;
    setAssigning(patientId);
    try {
      const { error } = await supabase.from("doctor_patients").insert({
        doctor_id: user.id,
        patient_id: patientId,
      });

      if (error) throw error;

      toast.success("Paciente asignado exitosamente");
      setResults((prev) =>
        prev.map((r) =>
          r.user_id === patientId ? { ...r, already_assigned: true } : r
        )
      );
      queryClient.invalidateQueries({ queryKey: ["doctor_patients"] });
    } catch (err: any) {
      toast.error(err.message || "Error al asignar paciente");
    } finally {
      setAssigning(null);
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Asignar Paciente</h2>
            </div>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Busca por número de cédula o nombre del paciente
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cédula o nombre..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="px-5 pb-5 max-h-[50vh] overflow-y-auto space-y-2">
            {searched && results.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No se encontraron pacientes</p>
              </div>
            )}

            {results.map((patient) => {
              const age = patient.date_of_birth
                ? Math.floor(
                    (Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000
                  )
                : null;

              return (
                <div
                  key={patient.user_id}
                  className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-card"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {patient.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {patient.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.document_id && `CC: ${patient.document_id}`}
                      {patient.document_id && age !== null && " • "}
                      {age !== null && `${age} años`}
                      {(patient.programs ?? []).length > 0 && ` • ${(patient.programs ?? []).map((p: string) => programLabels[p] ?? p).join(", ")}`}
                    </p>
                  </div>
                  {patient.already_assigned ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-success px-2 py-1 bg-success/10 rounded-lg">
                      <Check className="w-3 h-3" /> Asignado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssign(patient.user_id)}
                      disabled={assigning === patient.user_id}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {assigning === patient.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Asignar"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
