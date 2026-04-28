import { AlertTriangle, Heart, Pill, Droplets, Weight, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PatientAlert } from "@/hooks/useClinicalAlerts";

const ICON_MAP: Record<string, React.ElementType> = {
  heart: Heart,
  droplets: Droplets,
  weight: Weight,
  pill: Pill,
  "trending-down": TrendingDown,
};

export const ClinicalAlertsSection = ({ alerts }: { alerts: PatientAlert[] }) => {
  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          Alertas Clínicas ({alerts.length})
        </h2>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        <AnimatePresence>
          {alerts.map((alert) => {
            const Icon = ICON_MAP[alert.iconType] ?? AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  alert.severity === "critical"
                    ? "bg-destructive/10 border border-destructive/20"
                    : "bg-warning/10 border border-warning/20"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    alert.severity === "critical" ? "text-destructive" : "text-warning"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {alert.patient}
                  </p>
                  <p
                    className={`text-[10px] ${
                      alert.severity === "critical" ? "text-destructive" : "text-warning"
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    alert.severity === "critical"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {alert.severity === "critical" ? "CRÍTICO" : "ALERTA"}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
