import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronRight, ChevronDown, User } from "lucide-react";
import { useMyDoctors } from "@/hooks/useVitalSigns";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MyDoctorsSection = () => {
  const [open, setOpen] = useState(false);
  const { data: doctors } = useMyDoctors();

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Mis Médicos</p>
          <p className="text-xs text-muted-foreground">
            Equipo médico tratante
            {(doctors ?? []).length > 0 && ` (${doctors!.length})`}
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pl-4 pr-1 mt-2"
          >
            {(doctors ?? []).length > 0 ? (
              <div className="space-y-2 mb-3">
                {doctors!.map((d: any) => {
                  const profile = d.doctor_profile || d.profiles;
                  const name = profile?.full_name ?? "Médico";
                  const phone = profile?.phone;
                  return (
                    <div key={d.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
                        <p className="text-[11px] text-muted-foreground">
                          Asignado: {format(new Date(d.assigned_at), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">No tienes médicos asignados aún</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyDoctorsSection;
