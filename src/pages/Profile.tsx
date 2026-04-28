import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  FileText,
  Shield,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Pill,
  Heart,
  LogOut,
  X,
  Star,
  ExternalLink,
  Download,
} from "lucide-react";
import { useProfile, useConditions, useAllergies, useEmergencyContacts, useDeleteAllergy, useDeleteEmergencyContact } from "@/hooks/usePatientData";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useDoctorData";
import { useClinicalDocuments } from "@/hooks/useMedicalHistory";
import PatientClinicalNotes from "@/components/patient/PatientClinicalNotes";
import EditProfileForm from "@/components/forms/EditProfileForm";
import AvatarUpload from "@/components/profile/AvatarUpload";
import DoctorProfileView from "@/components/profile/DoctorProfileView";
import { AddEmailSection } from "@/components/profile/AddEmailSection";
import AddAllergyForm from "@/components/forms/AddAllergyForm";

import AddEmergencyContactForm from "@/components/forms/AddEmergencyContactForm";
import VitalSignsSection from "@/components/vitals/VitalSignsSection";
import MyDoctorsSection from "@/components/vitals/MyDoctorsSection";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PROGRAM_LABELS: Record<string, string> = {
  riesgo_cardiovascular: "Riesgo Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Enfermedad Renal",
  enfermedad_respiratoria: "Enfermedad Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
  prefiero_no_decir: "Prefiero no decir",
};

const PROFESSION_LABELS: Record<string, string> = {
  medico: "Médico",
  enfermera: "Enfermera",
  odontologo: "Odontólogo",
  auxiliar_enfermeria: "Auxiliar de Enfermería",
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

const menuItems = [
  { icon: Pill, label: "Mis Medicamentos", description: "Lista completa de tratamientos" },
  { icon: Shield, label: "Privacidad y Seguridad", description: "Configuración de datos" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const Profile = () => {
  const [historialOpen, setHistorialOpen] = useState(false);
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: conditions } = useConditions();
  const { data: allergies } = useAllergies();
  const { data: emergencyContacts } = useEmergencyContacts();
  const { data: clinicalDocs } = useClinicalDocuments();
  const deleteAllergy = useDeleteAllergy();
  const deleteContact = useDeleteEmergencyContact();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const isDoctor = role === "doctor";

  if (!roleLoading && isDoctor) {
    return <DoctorProfileView />;
  }

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
              {profile?.full_name ?? "Usuario"}
            </h1>
            {profile?.document_id && (
              <p className="text-sm text-muted-foreground">{profile.document_id}</p>
            )}
           <p className="text-xs text-muted-foreground">
              {profile?.gender && `${GENDER_LABELS[profile.gender] ?? profile.gender} • `}
              {profile?.date_of_birth && `${calcAge(profile.date_of_birth)} años • `}
              {profile?.blood_type && `${profile.blood_type} • `}
              {profile?.phone ?? "Sin teléfono"}
            </p>
          </div>
          <EditProfileForm />
        </div>
        <div className="flex gap-2 flex-wrap">
          {isDoctor && profile?.profession && (
            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-xs font-semibold">
              {PROFESSION_LABELS[profile.profession] ?? profile.profession}
            </span>
          )}
          {isDoctor && profile?.ips && (
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-semibold">
              🏥 {profile.ips}
            </span>
          )}
          {profile?.eps && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">
              {profile.eps}
            </span>
          )}
          {!isDoctor && (profile?.programs ?? []).filter((p: string) => p !== "otro").map((prog: string) => (
            <span key={prog} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
              {PROGRAM_LABELS[prog] ?? prog}
            </span>
          ))}
        </div>
      </motion.div>

      <AddEmailSection />

      {/* Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Diagnósticos
            {(conditions ?? []).length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({(conditions ?? []).length}/3)
              </span>
            )}
          </h2>
        </div>
        {(conditions ?? []).length > 0 ? (
          <div className="space-y-2">
            {conditions!.map((c) => {
              const isPrimary = c.is_primary;
              return (
                <div
                  key={c.id}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                    isPrimary
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : "bg-card text-foreground shadow-card border-2 border-transparent"
                  }`}
                >
                  {isPrimary && <Star className={`w-4 h-4 fill-primary text-primary shrink-0`} />}
                  <span className="flex-1">{c.name}</span>
                  {isPrimary && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Principal</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tu médico aún no ha registrado diagnósticos</p>
        )}
      </motion.div>

      {/* Allergies */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-emergency/5 border border-emergency/15 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emergency" />
            <p className="text-sm font-semibold text-foreground">Alergias</p>
          </div>
          <AddAllergyForm />
        </div>
        {(allergies ?? []).length > 0 ? (
          <div className="space-y-2">
            {allergies!.map((a) => (
              <div
                key={a.id}
                className="px-3 py-2.5 bg-emergency/10 rounded-xl text-sm font-medium text-emergency flex items-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{a.name}</span>
                {a.severity && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emergency/70">{a.severity}</span>
                )}
                <button onClick={() => deleteAllergy.mutate(a.id)} className="hover:text-destructive transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin alergias registradas</p>
        )}
      </motion.div>

      {/* Emergency Contacts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Contactos de Emergencia</h2>
          <AddEmergencyContactForm />
        </div>
        {(emergencyContacts ?? []).length === 1 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Se recomienda registrar al menos <strong>2 contactos</strong> de emergencia.
            </p>
          </div>
        )}
        {(emergencyContacts ?? []).length > 0 ? (
          <div className="space-y-2">
            {emergencyContacts!.map((contact) => (
              <div
                key={contact.id}
                className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emergency/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emergency" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {contact.name}
                    {contact.relationship ? ` (${contact.relationship})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
                <button onClick={() => deleteContact.mutate(contact.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Debes registrar al menos <strong>2 contactos</strong> de emergencia.
            </p>
          </div>
        )}
      </motion.div>

      {/* Clinical Notes from Doctor (read-only) */}
      <PatientClinicalNotes />

      {/* Menu */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-4">
        {/* Historial Médico - expandable (clinical documents only, read-only for patient) */}
        <motion.div variants={item}>
          <button
            onClick={() => setHistorialOpen(!historialOpen)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Historial Médico</p>
              <p className="text-xs text-muted-foreground">Documentos cargados por tu médico</p>
            </div>
            {historialOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {historialOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-4 pr-1"
              >
                <div className="mt-3 mb-3">
                  {(clinicalDocs ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {clinicalDocs!.map((doc) => (
                        <div key={doc.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                            {doc.description && <p className="text-xs text-muted-foreground truncate">{doc.description}</p>}
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors shrink-0" title="Descargar">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tu médico aún no ha cargado documentos clínicos.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Signos Vitales */}
        <VitalSignsSection />

        {/* Mis Médicos */}
        <MyDoctorsSection />

        {menuItems.map((menuItem, i) => (
          <motion.button
            key={i}
            variants={item}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <menuItem.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{menuItem.label}</p>
              <p className="text-xs text-muted-foreground">{menuItem.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}

        {/* Sign Out */}
        <motion.button
          variants={item}
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emergency/5 transition-colors mt-2"
        >
          <div className="w-10 h-10 rounded-xl bg-emergency/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-emergency" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-emergency">Cerrar Sesión</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Profile;
