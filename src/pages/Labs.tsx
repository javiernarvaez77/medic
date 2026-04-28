import { motion } from "framer-motion";
import { FlaskConical, TrendingUp, TrendingDown, Minus, FileText, Share2 } from "lucide-react";
import { useLabResults, usePendingLabs } from "@/hooks/usePatientData";

import { format } from "date-fns";
import { es } from "date-fns/locale";

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-warning" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-success" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const Labs = () => {
  const { data: labResults, isLoading } = useLabResults();
  const { data: pendingLabs } = usePendingLabs();

  const results = labResults ?? [];
  const pending = pendingLabs ?? [];

  if (isLoading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Laboratorios</h1>
      </div>

      {/* Pending Labs */}
      {pending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-4 mb-6"
        >
          <p className="text-sm font-semibold text-foreground mb-2">📋 Exámenes Pendientes</p>
          {pending.map((lab) => (
            <div key={lab.id} className="flex items-center justify-between py-1.5">
              <p className="text-sm text-foreground">{lab.name}</p>
              {lab.due_date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(lab.due_date), "d MMM yyyy", { locale: es })}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Results */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-lg font-semibold text-foreground mb-3">Últimos Resultados</h2>
        {results.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground mb-1">Sin resultados</p>
            <p className="text-sm text-muted-foreground">
              Tu médico puede cargar resultados desde su panel.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((lab) => (
              <motion.div
                key={lab.id}
                variants={item}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lab.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lab.result_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {lab.value ?? "—"}
                  </span>
                  {lab.unit && (
                    <span className="text-sm text-muted-foreground">{lab.unit}</span>
                  )}
                  {lab.normal_range && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Rango: {lab.normal_range}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {lab.file_url && (
                    <a
                      href={lab.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver PDF
                    </a>
                  )}
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Labs;
