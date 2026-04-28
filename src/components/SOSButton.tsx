import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

const SOSButton = () => {
  const [activated, setActivated] = useState(false);

  const handleSOS = () => {
    setActivated(true);
  };

  return (
    <>
      {/* Fixed SOS Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-5 pb-5 pt-4 bg-card/90 backdrop-blur-lg border-t border-border safe-bottom">
        <button
          onClick={handleSOS}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 py-4 rounded-2xl bg-emergency/5 border-2 border-emergency/20 text-emergency text-xl font-extrabold shadow-[0_4px_12px_hsl(0,72%,51%,0.1)] active:bg-emergency/10 transition-colors"
        >
          <AlertTriangle className="w-6 h-6" />
          Emergencia SOS
        </button>
      </div>

      {/* Full-screen SOS activated */}
      <AnimatePresence>
        {activated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-emergency flex flex-col items-center justify-center gap-6 p-8"
          >
            <button
              onClick={() => setActivated(false)}
              className="absolute top-6 right-6 text-emergency-foreground/80"
            >
              <X className="w-8 h-8" />
            </button>
            <AlertTriangle className="w-16 h-16 text-emergency-foreground animate-pulse" />
            <h2 className="text-2xl font-extrabold text-emergency-foreground text-center">
              Emergencia Activada
            </h2>
            <p className="text-emergency-foreground/80 text-center text-lg">
              Contactando servicios de emergencia y contactos...
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 bg-emergency-foreground/20 rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-emergency-foreground" />
                <span className="text-emergency-foreground text-sm font-medium">Llamando 123...</span>
              </div>
              <div className="flex items-center gap-2 bg-emergency-foreground/20 rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-emergency-foreground" />
                <span className="text-emergency-foreground text-sm font-medium">Enviando GPS</span>
              </div>
            </div>
            <button
              onClick={() => setActivated(false)}
              className="mt-8 px-8 py-3 bg-emergency-foreground/20 text-emergency-foreground rounded-2xl text-lg font-bold border-2 border-emergency-foreground/40"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SOSButton;
