import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Loader2, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import SedeSelect from "@/components/forms/SedeSelect";
import { toast } from "sonner";

const PROGRAM_OPTIONS = [
  { value: "", label: "Seleccionar programa..." },
  { value: "riesgo_cardiovascular", label: "Riesgo Cardiovascular" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertension", label: "Hipertensión" },
  { value: "enfermedad_renal", label: "Enfermedad Renal" },
  { value: "enfermedad_respiratoria", label: "Enfermedad Respiratoria" },
  { value: "tiroides", label: "Tiroides" },
  { value: "otro", label: "Otro" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "Masculino", label: "Masculino" },
  { value: "Femenino", label: "Femenino" },
  { value: "Otro", label: "Otro" },
];

interface CreatePatientDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreatePatientDialog = ({ open, onClose }: CreatePatientDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ document_id: string; temp_password: string } | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    document_id: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    eps: "",
    programs: [] as string[],
    sede_id: "",
    assign_to_me: true,
  });

  const updateForm = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm({
      full_name: "",
      document_id: "",
      phone: "",
      date_of_birth: "",
      gender: "",
      eps: "",
      programs: [],
      sede_id: "",
      assign_to_me: true,
    });
    setSuccess(false);
    setCredentials(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.document_id.trim()) {
      toast.error("Nombre y documento son obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            document_id: form.document_id.trim(),
            phone: form.phone.trim() || null,
            date_of_birth: form.date_of_birth || null,
            gender: form.gender || null,
            eps: form.eps.trim() || null,
            programs: form.programs.length > 0 ? form.programs : null,
            sede_id: form.sede_id || null,
            assign_to_me: form.assign_to_me,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear paciente");

      toast.success("¡Paciente creado exitosamente!");
      setCredentials({
        document_id: data.document_id,
        temp_password: data.temp_password,
      });
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["doctor_patients"] });
    } catch (err: any) {
      toast.error(err.message || "Error al crear paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full px-3 py-2.5 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block";

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
          className="bg-background rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Crear Paciente</h2>
            </div>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {success ? (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">¡Paciente creado!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comparte estas credenciales con el paciente para que pueda iniciar sesión:
              </p>

              {credentials && (
                <div className="bg-muted rounded-xl p-4 text-left mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Cédula (usuario)</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{credentials.document_id}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.document_id);
                        toast.success("Cédula copiada");
                      }}
                      className="p-1.5 rounded-lg hover:bg-background transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Contraseña temporal</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{credentials.temp_password}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.temp_password);
                        toast.success("Contraseña copiada");
                      }}
                      className="p-1.5 rounded-lg hover:bg-background transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-4">
                El paciente inicia sesión con su número de cédula y esta contraseña temporal.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium"
                >
                  Crear otro
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto max-h-[65vh] space-y-3">
              <p className="text-xs text-muted-foreground mb-1">
                Crea una cuenta para un paciente sin correo electrónico. Los campos con * son obligatorios.
              </p>

              {/* Full Name */}
              <div>
                <label className={labelClass}>Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => updateForm("full_name", e.target.value)}
                  placeholder="Carlos Mendoza"
                  className={inputClass}
                />
              </div>

              {/* Document ID */}
              <div>
                <label className={labelClass}>Número de documento (cédula) *</label>
                <input
                  type="text"
                  required
                  value={form.document_id}
                  onChange={(e) => updateForm("document_id", e.target.value)}
                  placeholder="1234567890"
                  className={inputClass}
                />
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="+57 301 234 5678"
                  className={inputClass}
                />
              </div>

              {/* Date of birth & Gender row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => updateForm("date_of_birth", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Género</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm("gender", e.target.value)}
                    className={inputClass}
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EPS */}
              <div>
                <label className={labelClass}>EPS</label>
                <input
                  type="text"
                  value={form.eps}
                  onChange={(e) => updateForm("eps", e.target.value)}
                  placeholder="Nombre de la EPS"
                  className={inputClass}
                />
              </div>

              {/* Programs */}
              <div>
                <label className={labelClass}>Programas crónicos (máx. 2)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PROGRAM_OPTIONS.filter(o => o.value !== "").map((o) => {
                    const selected = form.programs.includes(o.value);
                    const disabled = !selected && form.programs.length >= 2;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (selected) {
                            updateForm("programs", form.programs.filter((v: string) => v !== o.value));
                          } else {
                            updateForm("programs", [...form.programs, o.value]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : disabled
                            ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sede / IPS */}
              <div>
                <label className={labelClass}>Sede / IPS</label>
                <SedeSelect
                  value={form.sede_id}
                  onChange={(val) => updateForm("sede_id", val)}
                  className={inputClass}
                  allowCreate
                />
              </div>

              {/* Assign to me toggle */}
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <div
                  onClick={() => updateForm("assign_to_me", !form.assign_to_me)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                    form.assign_to_me ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      form.assign_to_me ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-sm text-foreground">Asignar a mis pacientes</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-card-md hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Crear Paciente
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
