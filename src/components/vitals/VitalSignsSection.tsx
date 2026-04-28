import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronRight, ChevronDown, Activity, Droplets, Scale, Trash2, AlertTriangle } from "lucide-react";
import { useBloodPressureReadings, useTodayBPCount, useDeleteBloodPressure, useGlucoseReadings, useDeleteGlucose, useWeightRecords, useDeleteWeight } from "@/hooks/useVitalSigns";
import { useProfile } from "@/hooks/usePatientData";
import AddBloodPressureForm from "./AddBloodPressureForm";
import AddGlucoseForm from "./AddGlucoseForm";
import AddWeightForm, { getBMICategory } from "./AddWeightForm";
import { BPChart, GlucoseChart, WeightBMIChart } from "./VitalCharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MEAL_CONTEXT_LABELS: Record<string, string> = {
  before_meal: "Antes de comer",
  after_meal: "Después de comer",
  fasting: "En ayunas",
  other: "Otro",
};

const getBPCategory = (sys: number, dia: number) => {
  if (sys < 90 || dia < 60) return { label: "Baja", color: "text-blue-600" };
  if (sys <= 120 && dia <= 80) return { label: "Normal", color: "text-green-600" };
  if (sys <= 139 || dia <= 89) return { label: "Elevada", color: "text-amber-600" };
  return { label: "Alta", color: "text-destructive" };
};

const VitalSignsSection = () => {
  const [open, setOpen] = useState(false);
  const { data: bpReadings } = useBloodPressureReadings();
  const { data: todayBPCount } = useTodayBPCount();
  const deleteBP = useDeleteBloodPressure();
  const { data: glucoseReadings } = useGlucoseReadings();
  const deleteGlucose = useDeleteGlucose();
  const { data: weightRecords } = useWeightRecords();
  const deleteWeight = useDeleteWeight();
  const { data: profile } = useProfile();

  const isDiabetesProgram = (profile?.programs ?? []).includes("diabetes");

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Heart className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Signos Vitales</p>
          <p className="text-xs text-muted-foreground">Presión, glucosa, peso e IMC</p>
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
            className="overflow-hidden pl-4 pr-1"
          >
            {/* Blood Pressure */}
            <div className="mt-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Presión Arterial
                </h3>
                <AddBloodPressureForm />
              </div>

              {(todayBPCount ?? 0) < 2 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Debes tomar al menos <strong>2 mediciones al día</strong>. Hoy llevas {todayBPCount ?? 0}.
                  </p>
                </div>
              )}

              {(bpReadings ?? []).length >= 2 && <BPChart data={bpReadings!} />}

              {(bpReadings ?? []).length > 0 ? (
                <div className="space-y-2">
                  {bpReadings!.slice(0, 5).map((r) => {
                    const cat = getBPCategory(r.systolic, r.diastolic);
                    return (
                      <div key={r.id} className="bg-card rounded-xl p-3 shadow-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-foreground">
                            {r.systolic}/{r.diastolic} <span className="font-normal text-xs text-muted-foreground">mmHg</span>
                            {r.pulse && <span className="ml-2 text-xs text-muted-foreground">🫀 {r.pulse} lpm</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase ${cat.color}`}>{cat.label}</span>
                            <button onClick={() => deleteBP.mutate(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(r.measurement_time), "dd MMM yyyy, HH:mm", { locale: es })}
                        </p>
                        {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros de presión arterial</p>
              )}
            </div>

            {/* Glucose - Only show if chronic program is diabetes */}
            {isDiabetesProgram && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    Glucosa
                  </h3>
                  <AddGlucoseForm />
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-xl mb-2">
                  <Droplets className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-foreground">
                    Registra tu glucosa <strong>antes y después</strong> de cada alimento principal.
                  </p>
                </div>

                {(glucoseReadings ?? []).length >= 2 && <GlucoseChart data={glucoseReadings!} />}

                {(glucoseReadings ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {glucoseReadings!.slice(0, 5).map((r) => {
                      const isHigh = Number(r.value) > 180;
                      const isLow = Number(r.value) < 70;
                      const alertColor = isHigh ? "text-destructive" : isLow ? "text-amber-600" : "text-green-600";
                      return (
                        <div key={r.id} className="bg-card rounded-xl p-3 shadow-card">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-foreground">
                              <span className={alertColor}>{Number(r.value).toFixed(0)}</span>{" "}
                              <span className="font-normal text-xs text-muted-foreground">mg/dL</span>
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {MEAL_CONTEXT_LABELS[r.meal_context] ?? r.meal_context}
                              </span>
                              <button onClick={() => deleteGlucose.mutate(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(r.measurement_time), "dd MMM yyyy, HH:mm", { locale: es })}
                            {r.meal_type && ` · ${r.meal_type}`}
                          </p>
                          {(isHigh || isLow) && (
                            <p className={`text-xs mt-1 font-medium ${alertColor}`}>
                              {isHigh ? "⚠️ Glucosa alta. Consulta con tu médico." : "⚠️ Glucosa baja. Consume alimentos."}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin registros de glucosa</p>
                )}
              </div>
            )}

            {/* Weight & BMI */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Peso e IMC
                </h3>
                <AddWeightForm />
              </div>

              {(weightRecords ?? []).length >= 2 && <WeightBMIChart data={weightRecords!} />}

              {(weightRecords ?? []).length > 0 ? (
                <div className="space-y-2">
                  {weightRecords!.slice(0, 5).map((r) => {
                    const bmi = Number(r.bmi);
                    const bmiInfo = getBMICategory(bmi);
                    return (
                      <div key={r.id} className="bg-card rounded-xl p-3 shadow-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-foreground">
                            {Number(r.weight_kg).toFixed(1)} kg
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {Number(r.height_cm).toFixed(0)} cm
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase ${bmiInfo.color}`}>
                              IMC {bmi.toFixed(1)} · {bmiInfo.label}
                            </span>
                            <button onClick={() => deleteWeight.mutate(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(r.measurement_date), "dd MMM yyyy", { locale: es })}
                        </p>
                        {bmiInfo.alert && (
                          <p className={`text-xs mt-1 font-medium ${bmiInfo.color}`}>
                            {bmi < 18.5 && "⚠️ Bajo peso. Consulta con tu médico."}
                            {bmi >= 25 && bmi < 30 && "⚠️ Sobrepeso. Se recomienda actividad física."}
                            {bmi >= 30 && "🚨 Obesidad. Consulta con tu médico."}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros de peso</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VitalSignsSection;
