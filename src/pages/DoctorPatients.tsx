import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Search, ChevronRight, ArrowLeft, LogOut,
  Pill, Calendar, FlaskConical, AlertTriangle, Heart,
  Activity, FileText, UserPlus, CalendarPlus,
  Home, Video, Building2, Beaker, MapPin, Star,
} from "lucide-react";
import ClinicalNotesSection from "@/components/doctor/ClinicalNotesSection";
import AddMedicationForPatientDialog from "@/components/doctor/AddMedicationForPatientDialog";
import AddConditionForPatientDialog from "@/components/doctor/AddConditionForPatientDialog";
import EditConditionDialog from "@/components/doctor/EditConditionDialog";
import UploadDocumentForPatientDialog from "@/components/doctor/UploadDocumentForPatientDialog";
import { AssignPatientDialog } from "@/components/doctor/AssignPatientDialog";
import { CreatePatientDialog } from "@/components/doctor/CreatePatientDialog";
import ScheduleAppointmentDialog from "@/components/doctor/ScheduleAppointmentDialog";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorPatients, usePatientDetail } from "@/hooks/useDoctorData";
import { useSedes, getDepartamentos, getMunicipios } from "@/hooks/useSedes";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BPChart, GlucoseChart, WeightBMIChart } from "@/components/vitals/VitalCharts";
import { AdherencePanel } from "@/components/patient/AdherencePanel";

const PROGRAM_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "riesgo_cardiovascular", label: "Cardiovascular" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertension", label: "HTA" },
  { value: "enfermedad_renal", label: "Renal" },
  { value: "enfermedad_respiratoria", label: "Respiratoria" },
  { value: "tiroides", label: "Tiroides" },
  { value: "otro", label: "Otro" },
];

const DoctorPatients = () => {
  const { data: patients, isLoading } = useDoctorPatients();
  const { data: sedes } = useSedes();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    searchParams.get("patient")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [sedeFilter, setSedeFilter] = useState("all");
  const [municipioFilter, setMunicipioFilter] = useState("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [schedulePatient, setSchedulePatient] = useState<Tables<"profiles"> | null>(null);

  // Keep URL ?patient= and selected state in sync
  useEffect(() => {
    const urlPatient = searchParams.get("patient");
    if (urlPatient !== selectedPatientId) {
      setSelectedPatientId(urlPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openPatient = (id: string) => {
    setSelectedPatientId(id);
    setSearchParams({ patient: id });
  };

  const closePatient = () => {
    setSelectedPatientId(null);
    setSearchParams({});
  };

  // Build sede lookup
  const sedeMap = new Map((sedes ?? []).map((s) => [s.id, s]));
  const municipiosAvailable = [...new Set((sedes ?? []).map((s) => s.municipio))].sort();

  const filteredPatients = (patients ?? []).filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.full_name.toLowerCase().includes(q) ||
      (p.document_id?.toLowerCase().includes(q) ?? false);
    const matchesProgram =
      programFilter === "all" || (p.programs ?? []).includes(programFilter);
    const pSede = (p as any).sede_id ? sedeMap.get((p as any).sede_id) : null;
    const matchesMunicipio =
      municipioFilter === "all" || pSede?.municipio === municipioFilter;
    const matchesSede =
      sedeFilter === "all" || (p as any).sede_id === sedeFilter;
    return matchesSearch && matchesProgram && matchesMunicipio && matchesSede;
  });

  if (selectedPatientId) {
    return (
      <PatientDetailView
        patientId={selectedPatientId}
        onBack={closePatient}
        onSchedule={(patient) => setSchedulePatient(patient)}
      />
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold text-foreground mb-4">Pacientes</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Program Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {PROGRAM_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setProgramFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              programFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Location Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={municipioFilter}
          onChange={(e) => {
            setMunicipioFilter(e.target.value);
            setSedeFilter("all");
          }}
          className="flex-1 py-2 px-3 bg-muted rounded-xl text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todos los municipios</option>
          {municipiosAvailable.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={sedeFilter}
          onChange={(e) => setSedeFilter(e.target.value)}
          className="flex-1 py-2 px-3 bg-muted rounded-xl text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todas las sedes</option>
          {(sedes ?? [])
            .filter((s) => municipioFilter === "all" || s.municipio === municipioFilter)
            .map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {filteredPatients.length === (patients?.length ?? 0)
            ? `${patients?.length ?? 0} pacientes asignados`
            : `${filteredPatients.length} de ${patients?.length ?? 0} pacientes`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-xl text-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" /> Crear
          </button>
          <button
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" /> Asignar
          </button>
        </div>
      </div>

      {/* Patient List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No se encontraron pacientes" : "No tienes pacientes asignados"}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
          className="space-y-2"
        >
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onSelect={() => openPatient(patient.user_id)}
              onSchedule={() => setSchedulePatient(patient)}
            />
          ))}
        </motion.div>
      )}

      <AssignPatientDialog open={assignOpen} onClose={() => setAssignOpen(false)} />
      <CreatePatientDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {schedulePatient && (
        <ScheduleAppointmentDialog
          open={!!schedulePatient}
          onClose={() => setSchedulePatient(null)}
          patient={schedulePatient}
        />
      )}
    </div>
  );
};

/* ─── Patient Card ─── */
const PatientCard = ({
  patient,
  onSelect,
  onSchedule,
}: {
  patient: Tables<"profiles">;
  onSelect: () => void;
  onSchedule: () => void;
}) => {
  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000)
    : null;

  const programLabels: Record<string, string> = {
    riesgo_cardiovascular: "Cardiovascular",
    diabetes: "Diabetes",
    hipertension: "Hipertensión",
    enfermedad_renal: "Renal",
    enfermedad_respiratoria: "Respiratoria",
    tiroides: "Tiroides",
    otro: "Otro",
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-card"
    >
      <button onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {patient.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{patient.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {age !== null && `${age} años`}
            {age !== null && (patient.programs ?? []).length > 0 && " • "}
            {(patient.programs ?? []).map((p: string) => programLabels[p] ?? p).join(", ")}
          </p>
        </div>
      </button>
      <button
        onClick={onSchedule}
        className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
        title="Agendar cita"
      >
        <CalendarPlus className="w-4 h-4 text-primary" />
      </button>
      <button onClick={onSelect} className="flex-shrink-0">
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
};

/* ─── Patient Detail View ─── */
const PatientDetailView = ({
  patientId,
  onBack,
  onSchedule,
}: {
  patientId: string;
  onBack: () => void;
  onSchedule: (patient: Tables<"profiles">) => void;
}) => {
  const { data: patient, isLoading } = usePatientDetail(patientId);
  const [schedulePatient, setSchedulePatient] = useState<Tables<"profiles"> | null>(null);

  if (isLoading || !patient) {
    return (
      <div className="px-4 pt-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000)
    : null;

  const todayMeds = (patient.medications ?? []).flatMap((med) =>
    med.times.map((time) => {
      const taken = (patient.medLogs ?? []).some(
        (log) => log.medication_id === med.id && log.scheduled_time === time && log.taken_at
      );
      return { med, time, taken };
    })
  );

  const adherenceRate =
    todayMeds.length > 0
      ? Math.round((todayMeds.filter((m) => m.taken).length / todayMeds.length) * 100)
      : null;

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button
          onClick={() => onSchedule(patient)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium"
        >
          <CalendarPlus className="w-3.5 h-3.5" /> Agendar Cita
        </button>
      </div>

      {/* Patient header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-card mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {patient.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{patient.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {age !== null && `${age} años`}
              {patient.gender && ` • ${patient.gender}`}
              {patient.blood_type && ` • ${patient.blood_type}`}
            </p>
            {patient.eps && (
              <p className="text-xs text-muted-foreground mt-0.5">EPS: {patient.eps}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-muted rounded-xl p-3 text-center">
            <Pill className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{patient.medications?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Medicamentos</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Activity className="w-4 h-4 text-secondary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {adherenceRate !== null ? `${adherenceRate}%` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Adherencia hoy</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <AlertTriangle className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{patient.allergies?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Alergias</p>
          </div>
        </div>
      </motion.div>

      {/* Adherence Panel */}
      <div className="mt-5">
        <AdherencePanel patient={patient} />
      </div>

      {/* Conditions */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Diagnósticos</h3>
          </div>
          <AddConditionForPatientDialog
            patientId={patientId}
            patientName={patient.full_name}
            currentConditionsCount={patient.conditions?.length ?? 0}
            hasPrimary={(patient.conditions ?? []).some((c) => c.is_primary)}
          />
        </div>
        <div className="space-y-2">
          {(patient.conditions?.length ?? 0) === 0 ? (
            <EmptyState text="Sin diagnósticos registrados" />
          ) : (
            patient.conditions!.map((c: any) => (
              <div key={c.id} className={`bg-card rounded-xl px-4 py-3 shadow-card ${c.is_primary ? "border-2 border-primary/30" : ""}`}>
                <div className="flex items-center gap-2">
                  {c.is_primary && <Star className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />}
                  <p className="text-sm font-medium text-foreground flex-1">{c.name}</p>
                  {c.cie10_code && (
                    <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {c.cie10_code}
                    </span>
                  )}
                  {c.is_primary && <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Principal</span>}
                  <EditConditionDialog condition={c} patientId={patientId} />
                </div>
                {c.diagnosed_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Desde {format(new Date(c.diagnosed_date), "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medications */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-foreground">Medicamentos Activos</h3>
          </div>
          <AddMedicationForPatientDialog patientId={patientId} patientName={patient.full_name} />
        </div>
        <div className="space-y-2">
        {(patient.medications?.length ?? 0) === 0 ? (
          <EmptyState text="Sin medicamentos activos" />
        ) : (
          patient.medications!.map((med) => {
            const medTaken = todayMeds.filter((m) => m.med.id === med.id);
            const takenCount = medTaken.filter((m) => m.taken).length;
            return (
              <div key={med.id} className="bg-card rounded-xl px-4 py-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{med.name} {med.dose}</p>
                    <p className="text-xs text-muted-foreground">{med.frequency} • {med.times.join(", ")}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    takenCount === medTaken.length && medTaken.length > 0
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {takenCount}/{medTaken.length}
                  </span>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Allergies */}
      <Section title="Alergias" icon={AlertTriangle} color="text-destructive">
        {(patient.allergies?.length ?? 0) === 0 ? (
          <EmptyState text="Sin alergias registradas" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {patient.allergies!.map((a) => (
              <span
                key={a.id}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                  a.severity === "severe"
                    ? "bg-destructive/10 text-destructive"
                    : a.severity === "moderate"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a.name} {a.severity === "severe" && "⚠️"}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Vital Signs Charts */}
      <Section title="Signos Vitales" icon={Heart} color="text-destructive">
        {(patient.bpReadings?.length ?? 0) === 0 &&
         (patient.glucoseReadings?.length ?? 0) === 0 &&
         (patient.weightRecords?.length ?? 0) === 0 ? (
          <EmptyState text="Sin registros de signos vitales" />
        ) : (
          <>
            {(patient.bpReadings?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Última: {patient.bpReadings![0].systolic}/{patient.bpReadings![0].diastolic} mmHg
                  {patient.bpReadings![0].pulse && ` • ${patient.bpReadings![0].pulse} lpm`}
                </p>
                <BPChart data={patient.bpReadings!} />
              </div>
            )}
            {(patient.glucoseReadings?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Última: {Number(patient.glucoseReadings![0].value)} mg/dL ({patient.glucoseReadings![0].meal_context})
                </p>
                <GlucoseChart data={patient.glucoseReadings!} />
              </div>
            )}
            {(patient.weightRecords?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Último: {Number(patient.weightRecords![0].weight_kg)} kg • IMC {Number(patient.weightRecords![0].bmi).toFixed(1)}
                </p>
                <WeightBMIChart data={patient.weightRecords!} />
              </div>
            )}
          </>
        )}
      </Section>

      {/* Recent Labs */}
      <Section title="Últimos Laboratorios" icon={FlaskConical} color="text-info">
        {(patient.labResults?.length ?? 0) === 0 ? (
          <EmptyState text="Sin resultados de laboratorio" />
        ) : (
          patient.labResults!.slice(0, 5).map((lab) => (
            <div key={lab.id} className="bg-card rounded-xl px-4 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{lab.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(lab.result_date), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {lab.value ?? "—"} {lab.unit && <span className="text-xs font-normal text-muted-foreground">{lab.unit}</span>}
                  </p>
                  {lab.normal_range && (
                    <p className="text-[10px] text-muted-foreground">Ref: {lab.normal_range}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Appointments */}
      <Section title="Citas Recientes" icon={Calendar} color="text-primary">
        {(patient.appointments?.length ?? 0) === 0 ? (
          <EmptyState text="Sin citas registradas" />
        ) : (
          patient.appointments!.slice(0, 3).map((apt) => (
            <div key={apt.id} className="bg-card rounded-xl px-4 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(apt.appointment_date), "d MMM yyyy • h:mm a", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(apt as any).modality === "domiciliaria" ? "Domiciliaria" : (apt as any).modality === "telemedicina" ? "Telemedicina" : "Centro de Salud"}
                    {apt.location && ` • ${apt.location}`}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                  apt.status === "completed" ? "bg-success/10 text-success"
                    : apt.status === "cancelled" ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {apt.status === "completed" ? "Completada"
                    : apt.status === "cancelled" ? "Cancelada"
                    : "Programada"}
                </span>
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Clinical Documents Upload */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Documentos Clínicos</h3>
          </div>
          <UploadDocumentForPatientDialog patientId={patientId} patientName={patient.full_name} />
        </div>
      </div>

      {/* Clinical Notes */}
      <ClinicalNotesSection patientId={patientId} />

      {schedulePatient && (
        <ScheduleAppointmentDialog
          open={!!schedulePatient}
          onClose={() => setSchedulePatient(null)}
          patient={schedulePatient}
        />
      )}
    </div>
  );
};

/* ─── Helpers ─── */
const Section = ({ title, icon: Icon, color, children }: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="bg-card rounded-xl px-4 py-4 shadow-card text-center">
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

export default DoctorPatients;
