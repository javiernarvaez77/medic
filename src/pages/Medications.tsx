import { motion } from "framer-motion";
import { Pill, Check, Clock, AlertTriangle, Lock } from "lucide-react";
import { useMedications, useTodayMedLogs, useToggleMedLog } from "@/hooks/usePatientData";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const Medications = () => {
  const { data: medications, isLoading } = useMedications();
  const { data: medLogs } = useTodayMedLogs();
  const toggleMed = useToggleMedLog();

  const meds = medications ?? [];
  const logs = medLogs ?? [];

  const isTaken = (medId: string, time: string) =>
    logs.some((l) => l.medication_id === medId && l.scheduled_time === time && l.taken_at);

  const totalDoses = meds.reduce((sum, m) => sum + m.times.length, 0);
  const takenDoses = meds.reduce(
    (sum, m) => sum + m.times.filter((t) => isTaken(m.id, t)).length,
    0
  );
  const adherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const pendingDoses = totalDoses - takenDoses;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Medicamentos</h1>
      </div>

      {meds.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">Sin medicamentos</p>
          <p className="text-sm text-muted-foreground">
            Tu médico puede agregar medicamentos desde su panel.
          </p>
        </div>
      ) : (
        <>
          {/* Adherence Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Adherencia de hoy</p>
              <span
                className={`text-2xl font-bold ${
                  adherence >= 80
                    ? "text-success"
                    : adherence >= 50
                    ? "text-warning"
                    : "text-emergency"
                }`}
              >
                {adherence}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${adherence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  adherence >= 80
                    ? "bg-success"
                    : adherence >= 50
                    ? "bg-warning"
                    : "bg-emergency"
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {takenDoses} de {totalDoses} dosis tomadas
            </p>
          </motion.div>

          {/* Medication List */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {meds.map((med) => (
              <motion.div
                key={med.id}
                variants={item}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {med.name} {med.dose}
                    </p>
                    {med.condition && (
                      <p className="text-xs text-muted-foreground">{med.condition}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{med.frequency}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {med.times.map((time) => {
                    const taken = isTaken(med.id, time);
                    const now = new Date();
                    const [hh, mm] = time.split(":").map(Number);
                    const scheduledDate = new Date();
                    scheduledDate.setHours(hh, mm, 0, 0);
                    const isTooEarly = !taken && now < scheduledDate;

                    return (
                      <button
                        key={time}
                        onClick={() => {
                          if (isTooEarly) {
                            toast.error(`Aún no es hora de tomar esta dosis (${time})`);
                            return;
                          }
                          toggleMed.mutate({
                            medicationId: med.id,
                            scheduledTime: time,
                            currentlyTaken: taken,
                          });
                        }}
                        disabled={toggleMed.isPending}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          taken
                            ? "bg-success/10 text-success"
                            : isTooEarly
                            ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {taken ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : isTooEarly ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {time}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Missed Alert */}
          {pendingDoses > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 mb-4 bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Dosis pendientes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tienes {pendingDoses} dosis pendientes hoy. Recuerda tomar tus medicamentos a tiempo.
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Medications;
