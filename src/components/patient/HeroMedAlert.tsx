import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check } from "lucide-react";
import { useToggleMedLog } from "@/hooks/usePatientData";

interface HeroMedAlertProps {
  medication: { id: string; name: string; dose: string };
  time: string;
}

const HeroMedAlert = ({ medication, time }: HeroMedAlertProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toggleMed = useToggleMedLog();

  const handleConfirm = () => {
    setShowConfirm(false);
    toggleMed.mutate(
      { medicationId: medication.id, scheduledTime: time, currentlyTaken: false },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2500);
        },
      }
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[hsl(221,83%,45%)] p-7 text-primary-foreground shadow-[0_10px_25px_hsl(221,83%,53%,0.25)]"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary-foreground/10" />
        <p className="text-lg font-semibold opacity-90 mb-2">⏰ Es hora de tomar:</p>
        <p className="text-3xl font-extrabold mb-6 leading-tight">
          {medication.name} {medication.dose}
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-primary-foreground text-primary rounded-2xl py-4 text-xl font-extrabold shadow-card-md active:scale-[0.98] transition-transform"
        >
          Confirmar Toma
        </button>
      </motion.div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-foreground/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-card w-full max-w-[500px] rounded-t-[2rem] p-10 text-center shadow-card-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-[90px] h-[90px] rounded-full bg-accent flex items-center justify-center text-5xl mx-auto mb-6 animate-[gentlePulse_2s_infinite]">
                💊
              </div>
              <h3 className="text-3xl font-extrabold text-foreground mb-2">
                {medication.name} {medication.dose}
              </h3>
              <p className="text-xl text-muted-foreground mb-8">
                Es el momento de tomar tu medicina.
              </p>
              <button
                onClick={handleConfirm}
                disabled={toggleMed.isPending}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold shadow-[0_8px_20px_hsl(221,83%,53%,0.2)] active:scale-[0.98] transition-transform"
              >
                Registrar Toma
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-foreground/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-card w-full max-w-[500px] rounded-t-[2rem] p-10 pb-16 text-center shadow-card-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-[90px] h-[90px] rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-success" />
              </div>
              <h3 className="text-3xl font-extrabold text-foreground mb-2">¡Excelente!</h3>
              <p className="text-xl text-muted-foreground mb-8">
                Has registrado tu medicina correctamente.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-success text-success-foreground rounded-2xl py-5 text-xl font-bold shadow-[0_8px_20px_hsl(160,84%,39%,0.2)] active:scale-[0.98] transition-transform"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroMedAlert;
