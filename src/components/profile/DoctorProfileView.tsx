import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, CalendarDays, Building2, BadgeCheck, LogOut, Briefcase, Stethoscope, Plus, X, ChevronDown, ChevronRight, Heart, Activity, Trash2, MapPin, Search } from "lucide-react";
import { useSedes } from "@/hooks/useSedes";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useProfile } from "@/hooks/usePatientData";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorPatients, useDoctorAppointments } from "@/hooks/useDoctorData";
import EditProfileForm from "@/components/forms/EditProfileForm";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PROFESSION_LABELS: Record<string, string> = {
  medico: "Médico",
  enfermera: "Enfermera",
  odontologo: "Odontólogo",
  auxiliar_enfermeria: "Auxiliar de Enfermería",
};

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
  prefiero_no_decir: "Prefiero no decir",
};

const calcAge = (dob: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const COMMON_SPECIALTIES = [
  "Medicina General",
  "Medicina Interna",
  "Cardiología",
  "Endocrinología",
  "Nefrología",
  "Neumología",
  "Geriatría",
  "Nutrición",
  "Psicología",
  "Odontología",
  "Enfermería",
  "Fisioterapia",
];

const PROGRAM_LABELS: Record<string, string> = {
  riesgo_cardiovascular: "Riesgo Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Enfermedad Renal",
  enfermedad_respiratoria: "Enfermedad Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

const PROGRAM_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "bg-destructive/10",
  diabetes: "bg-amber-500/10",
  hipertension: "bg-primary/10",
  enfermedad_renal: "bg-violet-500/10",
  enfermedad_respiratoria: "bg-sky-500/10",
  tiroides: "bg-emerald-500/10",
};

const PROGRAM_ICON_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "text-destructive",
  diabetes: "text-amber-500",
  hipertension: "text-primary",
  enfermedad_renal: "text-violet-500",
  enfermedad_respiratoria: "text-sky-500",
  tiroides: "text-emerald-500",
};

const PROGRAM_CHART_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "hsl(0, 84%, 60%)",
  diabetes: "hsl(38, 92%, 50%)",
  hipertension: "hsl(199, 89%, 48%)",
  enfermedad_renal: "hsl(263, 70%, 50%)",
  enfermedad_respiratoria: "hsl(199, 95%, 54%)",
  tiroides: "hsl(160, 84%, 39%)",
  otro: "hsl(215, 14%, 70%)",
};

const DoctorProfileView = () => {
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: patients } = useDoctorPatients();
  const { data: appointments } = useDoctorAppointments();
  const [newSpecialty, setNewSpecialty] = useState("");
  const [showAddSpecialty, setShowAddSpecialty] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [showAddSede, setShowAddSede] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [patientPage, setPatientPage] = useState(0);
  const [patientSearch, setPatientSearch] = useState("");
  const PATIENTS_PER_PAGE = 20;
  const [newSede, setNewSede] = useState({ nombre: "", municipio: "", departamento: "" });
  const [creatingSede, setCreatingSede] = useState(false);
  const queryClient = useQueryClient();
  const { data: sedes } = useSedes();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weekAppointments = (appointments ?? []).filter((a) => {
    const d = new Date(a.appointment_date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd }) && a.status !== "cancelled";
  });

  const completedThisWeek = weekAppointments.filter((a) => a.status === "completed").length;
  const scheduledThisWeek = weekAppointments.filter((a) => a.status === "scheduled" || a.status === "rescheduled").length;
  const specialties: string[] = (profile as any)?.specialties ?? [];

  const addSpecialty = async (name: string) => {
    if (!profile || !name.trim()) return;
    const updated = [...specialties, name.trim()];
    const { error } = await supabase
      .from("profiles")
      .update({ specialties: updated } as any)
      .eq("user_id", profile.user_id);
    if (error) { toast.error("Error al agregar especialidad"); return; }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setNewSpecialty("");
    setShowAddSpecialty(false);
    toast.success("Especialidad agregada");
  };

  const removeSpecialty = async (index: number) => {
    if (!profile) return;
    const updated = specialties.filter((_, i) => i !== index);
    const { error } = await supabase
      .from("profiles")
      .update({ specialties: updated } as any)
      .eq("user_id", profile.user_id);
    if (error) { toast.error("Error al eliminar especialidad"); return; }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Especialidad eliminada");
  };

  const availableSuggestions = COMMON_SPECIALTIES.filter(
    (s) => !specialties.includes(s) && s.toLowerCase().includes(newSpecialty.toLowerCase())
  );

  const handleCreateSede = async () => {
    if (!newSede.nombre.trim() || !newSede.municipio.trim() || !newSede.departamento.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    setCreatingSede(true);
    try {
      const { error } = await (supabase as any)
        .from("sedes")
        .insert({
          nombre: newSede.nombre.trim(),
          municipio: newSede.municipio.trim(),
          departamento: newSede.departamento.trim(),
        });
      if (error) throw error;
      toast.success("Sede creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
      setNewSede({ nombre: "", municipio: "", departamento: "" });
      setShowAddSede(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear sede");
    } finally {
      setCreatingSede(false);
    }
  };

  const handleDeleteSede = async (sedeId: string) => {
    try {
      const { error } = await (supabase as any).from("sedes").delete().eq("id", sedeId);
      if (error) throw error;
      toast.success("Sede eliminada");
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar sede");
    }
  };

  // Group patients by chronic program
  const patientsByProgram = (patients ?? []).reduce<Record<string, typeof patients>>((acc, p) => {
    const progs = p.programs ?? [];
    progs.forEach((prog: string) => {
      if (prog && prog !== "otro") {
        if (!acc[prog]) acc[prog] = [];
        acc[prog]!.push(p);
      }
    });
    return acc;
  }, {});
  const programEntries = Object.entries(patientsByProgram);
  const noProgramPatients = (patients ?? []).filter((p) => !p.programs || p.programs.length === 0);

  // Chart data for donut
  const chartData = [
    ...programEntries.map(([program, pts]) => ({
      name: PROGRAM_LABELS[program] ?? program,
      value: pts!.length,
      color: PROGRAM_CHART_COLORS[program] ?? PROGRAM_CHART_COLORS.otro,
    })),
    ...(noProgramPatients.length > 0
      ? [{ name: "Sin programa", value: noProgramPatients.length, color: PROGRAM_CHART_COLORS.otro }]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-card mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <AvatarUpload />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {profile?.full_name ?? "Profesional"}
            </h1>
            {profile?.document_id && (
              <p className="text-sm text-muted-foreground">{profile.document_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {profile?.gender && `${GENDER_LABELS[profile.gender] ?? profile.gender} • `}
              {profile?.date_of_birth && `${calcAge(profile.date_of_birth)} años • `}
              {profile?.phone ?? "Sin teléfono"}
            </p>
          </div>
          <EditProfileForm />
        </div>

        {/* Professional badges */}
        <div className="flex gap-2 flex-wrap">
          {profile?.profession && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {PROFESSION_LABELS[profile.profession] ?? profile.profession}
            </span>
          )}
          {profile?.ips && (
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {profile.ips}
            </span>
          )}
          {(profile as any)?.professional_id && (
            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-xs font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Reg. {(profile as any).professional_id}
            </span>
          )}
        </div>

        {/* Address */}
        {profile?.address && (
          <p className="text-xs text-muted-foreground mt-3">📍 {profile.address}</p>
        )}
      </motion.div>

      {/* Specialties */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Especialidades
          </h2>
          <button
            onClick={() => setShowAddSpecialty(!showAddSpecialty)}
            className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>

        {showAddSpecialty && (
          <div className="bg-card rounded-xl p-3 shadow-card mb-3">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSpecialty(newSpecialty)}
              placeholder="Escribe una especialidad..."
              className="w-full text-sm bg-muted rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 mb-2"
            />
            {newSpecialty && availableSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableSuggestions.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => addSpecialty(s)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!newSpecialty && availableSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    onClick={() => addSpecialty(s)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {specialties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {specialties.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Stethoscope className="w-3 h-3" />
                {s}
                <button
                  onClick={() => removeSpecialty(i)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin especialidades registradas. Agrega tus áreas de atención.</p>
        )}
      </motion.div>

      {/* Sedes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Sedes
          </h2>
          <button
            onClick={() => setShowAddSede(!showAddSede)}
            className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>

        {showAddSede && (
          <div className="bg-card rounded-xl p-3 shadow-card mb-3 space-y-2">
            <input
              type="text"
              value={newSede.nombre}
              onChange={(e) => setNewSede((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre de la sede"
              className="w-full text-sm bg-muted rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newSede.municipio}
                onChange={(e) => setNewSede((p) => ({ ...p, municipio: e.target.value }))}
                placeholder="Municipio"
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                value={newSede.departamento}
                onChange={(e) => setNewSede((p) => ({ ...p, departamento: e.target.value }))}
                placeholder="Departamento"
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateSede}
                disabled={creatingSede}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {creatingSede ? "Creando..." : "Crear Sede"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddSede(false); setNewSede({ nombre: "", municipio: "", departamento: "" }); }}
                className="px-3 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {(sedes ?? []).length > 0 ? (
          <div className="space-y-2">
            {(sedes ?? []).map((s) => (
              <div key={s.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground">{s.municipio}, {s.departamento}</p>
                </div>
                <button
                  onClick={() => handleDeleteSede(s.id)}
                  className="w-8 h-8 rounded-xl hover:bg-destructive/10 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay sedes registradas. Crea una para que tus pacientes puedan seleccionarla.</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-3">Resumen de Actividad</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{(patients ?? []).length}</p>
              <p className="text-xs text-muted-foreground">Pacientes asignados</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{scheduledThisWeek}</p>
              <p className="text-xs text-muted-foreground">Citas esta semana</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 col-span-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedThisWeek}</p>
              <p className="text-xs text-muted-foreground">Citas atendidas esta semana</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emergency/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emergency/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-emergency" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-emergency">Cerrar Sesión</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
};

export default DoctorProfileView;
