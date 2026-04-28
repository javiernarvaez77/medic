import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SedeSelect from "@/components/forms/SedeSelect";
import { Pencil } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/usePatientData";
import { useUserRole } from "@/hooks/useDoctorData";

import { toast } from "sonner";


const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
];
const PROGRAMS: { value: string; label: string }[] = [
  { value: "riesgo_cardiovascular", label: "Riesgo Cardiovascular" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertension", label: "Hipertensión" },
  { value: "enfermedad_renal", label: "Enfermedad Renal" },
  { value: "enfermedad_respiratoria", label: "Enfermedad Respiratoria" },
  { value: "tiroides", label: "Tiroides" },
  { value: "otro", label: "Otro" },
];
const PROFESSIONS = [
  { value: "medico", label: "Médico" },
  { value: "enfermera", label: "Enfermera" },
  { value: "odontologo", label: "Odontólogo" },
  { value: "auxiliar_enfermeria", label: "Auxiliar de Enfermería" },
];

const calcAge = (dob: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const EditProfileForm = () => {
  const [open, setOpen] = useState(false);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: role } = useUserRole();
  const isDoctor = role === "doctor";

  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [eps, setEps] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [profession, setProfession] = useState("");
  const [ips, setIps] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [sedeId, setSedeId] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setDocumentId(profile.document_id ?? "");
      setDateOfBirth(profile.date_of_birth ?? "");
      setPhone(profile.phone ?? "");
      setBloodType(profile.blood_type ?? "");
      setEps(profile.eps ?? "");
      setPrograms(profile.programs ?? []);
      setAddress((profile as any).address ?? "");
      setGender((profile as any).gender ?? "");
      setProfession((profile as any).profession ?? "");
      setIps((profile as any).ips ?? "");
      setProfessionalId((profile as any).professional_id ?? "");
      setSedeId((profile as any).sede_id ?? "");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const updates: Record<string, any> = {
      full_name: fullName.trim(),
      document_id: documentId.trim() || null,
      date_of_birth: dateOfBirth || null,
      phone: phone.trim() || null,
      blood_type: bloodType || null,
      eps: eps.trim() || null,
      programs: programs,
      address: address.trim() || null,
      gender: gender || null,
      sede_id: sedeId || null,
    };
    if (isDoctor) {
      updates.profession = profession || null;
      updates.professional_id = professionalId.trim() || null;
    }
    updateProfile.mutate(
      updates as any,
      {
        onSuccess: () => { toast.success("Perfil actualizado"); setOpen(false); },
        onError: () => toast.error("Error al actualizar perfil"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
          <Pencil className="w-4 h-4 text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre Completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" maxLength={100} />
          </div>
          <div>
            <Label>Documento de Identidad</Label>
            <Input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="Ej: 1234567890" className="mt-1" maxLength={20} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Edad</Label>
              <Input value={calcAge(dateOfBirth) !== null ? `${calcAge(dateOfBirth)} años` : ""} readOnly className="mt-1 bg-muted" placeholder="Se calcula automáticamente" />
            </div>
          </div>
          <div>
            <Label>Género</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 3001234567" className="mt-1" maxLength={15} />
          </div>
          <div>
            <Label>Tipo de Sangre</Label>
            <Select value={bloodType} onValueChange={setBloodType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!isDoctor && (
            <div>
              <Label>EPS</Label>
              <Input value={eps} onChange={(e) => setEps(e.target.value)} placeholder="Ej: Sura, Nueva EPS" className="mt-1" maxLength={100} />
            </div>
          )}
          <div>
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Cra 15 #45-20, Bogotá" className="mt-1" maxLength={200} />
          </div>

          {/* Sede / IPS */}
          <div>
            <Label>Sede / IPS</Label>
            <div className="mt-1">
              <SedeSelect
                value={sedeId}
                onChange={setSedeId}
                allowCreate={isDoctor}
              />
            </div>
          </div>

          {!isDoctor && (
            <div>
              <Label>Programas Crónicos (máx. 2)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROGRAMS.filter(p => p.value !== "otro").map((p) => {
                  const selected = programs.includes(p.value);
                  const disabled = !selected && programs.length >= 2;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (selected) {
                          setPrograms(programs.filter(v => v !== p.value));
                        } else {
                          setPrograms([...programs, p.value]);
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
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {isDoctor && (
            <>
              <div>
                <Label>Profesión *</Label>
                <Select value={profession} onValueChange={setProfession}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar profesión" /></SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Registro Profesional</Label>
                <Input value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} placeholder="Ej: TP-12345" className="mt-1" maxLength={30} />
              </div>
            </>
          )}
          <Button type="submit" className="w-full rounded-xl" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileForm;
