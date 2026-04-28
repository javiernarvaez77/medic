import { motion } from "framer-motion";
import { Heart, Droplets, Weight, Activity } from "lucide-react";
import { useBloodPressureReadings, useGlucoseReadings, useWeightRecords } from "@/hooks/useVitalSigns";
import { useProfile } from "@/hooks/usePatientData";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// AHA/ACC 2017 Classification
const getBPStatus = (sys: number, dia: number): { label: string; detail: string; color: string; bg: string } => {
  if (sys >= 180 || dia >= 120)
    return { label: "Crisis hipertensiva", detail: "Busque atención médica de urgencia", color: "text-destructive", bg: "bg-destructive/10" };
  if (sys >= 140 || dia >= 90)
    return { label: "Hipertensión grado 2", detail: "Presión muy elevada, consulte a su médico", color: "text-destructive", bg: "bg-destructive/10" };
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89))
    return { label: "Hipertensión grado 1", detail: "Presión ligeramente elevada", color: "text-warning", bg: "bg-warning/10" };
  if (sys >= 120 && sys <= 129 && dia < 80)
    return { label: "Elevada", detail: "Presión un poco por encima de lo ideal", color: "text-warning", bg: "bg-warning/10" };
  if (sys < 90 || dia < 60)
    return { label: "Hipotensión", detail: "Presión baja, consulte a su médico", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Normal", detail: "Su presión arterial está en rango saludable", color: "text-success", bg: "bg-success/10" };
};

// ADA Classification (mg/dL, fasting / random)
const getGlucoseStatus = (val: number, context: string): { label: string; detail: string; color: string; bg: string } => {
  const isAyunas = context === "ayunas";
  if (isAyunas) {
    if (val < 54) return { label: "Hipoglucemia severa", detail: "Nivel peligrosamente bajo, busque ayuda", color: "text-destructive", bg: "bg-destructive/10" };
    if (val < 70) return { label: "Hipoglucemia", detail: "Glucosa baja, consuma algo dulce", color: "text-warning", bg: "bg-warning/10" };
    if (val <= 99) return { label: "Normal", detail: "Glucosa en ayunas dentro del rango ideal", color: "text-success", bg: "bg-success/10" };
    if (val <= 125) return { label: "Prediabetes", detail: "Glucosa en ayunas elevada, vigile su dieta", color: "text-warning", bg: "bg-warning/10" };
    if (val <= 200) return { label: "Diabetes", detail: "Glucosa alta, consulte a su médico", color: "text-destructive", bg: "bg-destructive/10" };
    return { label: "Hiperglucemia severa", detail: "Nivel muy alto, busque atención médica", color: "text-destructive", bg: "bg-destructive/10" };
  }
  // Post-prandial / random
  if (val < 54) return { label: "Hipoglucemia severa", detail: "Nivel peligrosamente bajo, busque ayuda", color: "text-destructive", bg: "bg-destructive/10" };
  if (val < 70) return { label: "Hipoglucemia", detail: "Glucosa baja, consuma algo dulce", color: "text-warning", bg: "bg-warning/10" };
  if (val <= 140) return { label: "Normal", detail: "Glucosa después de comer en rango normal", color: "text-success", bg: "bg-success/10" };
  if (val <= 180) return { label: "Elevada", detail: "Glucosa un poco alta después de comer", color: "text-warning", bg: "bg-warning/10" };
  if (val <= 250) return { label: "Alta", detail: "Glucosa elevada, controle su alimentación", color: "text-destructive", bg: "bg-destructive/10" };
  return { label: "Hiperglucemia severa", detail: "Nivel muy alto, busque atención médica", color: "text-destructive", bg: "bg-destructive/10" };
};

// WHO BMI Classification
const getBMIStatus = (bmi: number): { label: string; detail: string; color: string; bg: string } => {
  if (bmi >= 40) return { label: "Obesidad grado III", detail: "IMC muy alto, requiere atención médica", color: "text-destructive", bg: "bg-destructive/10" };
  if (bmi >= 35) return { label: "Obesidad grado II", detail: "IMC elevado, consulte a su médico", color: "text-destructive", bg: "bg-destructive/10" };
  if (bmi >= 30) return { label: "Obesidad grado I", detail: "IMC por encima del rango saludable", color: "text-destructive", bg: "bg-destructive/10" };
  if (bmi >= 25) return { label: "Sobrepeso", detail: "Un poco por encima del peso ideal", color: "text-warning", bg: "bg-warning/10" };
  if (bmi < 16) return { label: "Delgadez severa", detail: "Peso muy bajo, consulte a su médico", color: "text-destructive", bg: "bg-destructive/10" };
  if (bmi < 17) return { label: "Delgadez moderada", detail: "Peso bajo, vigile su alimentación", color: "text-warning", bg: "bg-warning/10" };
  if (bmi < 18.5) return { label: "Bajo peso", detail: "Ligeramente por debajo del peso ideal", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Peso normal", detail: "Su peso está en un rango saludable", color: "text-success", bg: "bg-success/10" };
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const VitalsSummaryCard = () => {
  const { data: bpReadings } = useBloodPressureReadings();
  const { data: glucoseReadings } = useGlucoseReadings();
  const { data: weightRecords } = useWeightRecords();
  const { data: profile } = useProfile();

  const isDiabetes = (profile?.programs ?? []).includes("diabetes");
  const latestBP = bpReadings?.[0];
  const latestGlucose = glucoseReadings?.[0];
  const latestWeight = weightRecords?.[0];

  const hasAnyVital = latestBP || latestGlucose || latestWeight;

  if (!hasAnyVital) return null;

  return (
    <div className="mt-8">
      <h2 className="text-[22px] font-bold text-foreground mb-4">
        Mis Signos Vitales
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {/* Blood Pressure */}
        {latestBP && (() => {
          const status = getBPStatus(latestBP.systolic, latestBP.diastolic);
          return (
            <motion.div
              variants={item}
              className="bg-card rounded-2xl p-4 shadow-card col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <Heart className="w-7 h-7 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Presión Arterial
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-2xl font-extrabold text-foreground">
                      {latestBP.systolic}/{latestBP.diastolic}
                    </p>
                    <span className="text-sm text-muted-foreground font-medium">mmHg</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    {latestBP.pulse && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {latestBP.pulse} lpm
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1.5 font-medium ${status.color}`}>
                    {status.detail}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(latestBP.measurement_time), "d MMM, h:mm a", { locale: es })}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Glucose */}
        {latestGlucose && (isDiabetes || glucoseReadings!.length > 0) && (() => {
          const val = Number(latestGlucose.value);
          const status = getGlucoseStatus(val, latestGlucose.meal_context);
          const contextLabel = latestGlucose.meal_context === "ayunas" ? "En ayunas" : "Después de comer";
          return (
            <motion.div
              variants={item}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Droplets className="w-7 h-7 text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Glucosa
                </p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">
                  {val}
                </p>
                <span className="text-xs text-muted-foreground">mg/dL</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg mt-1.5 ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                <p className={`text-[10px] mt-1 font-medium ${status.color} leading-tight`}>
                  {status.detail}
                </p>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {contextLabel} • {format(new Date(latestGlucose.measurement_time), "d MMM", { locale: es })}
                </span>
              </div>
            </motion.div>
          );
        })()}

        {/* Weight / BMI */}
        {latestWeight && (() => {
          const bmi = latestWeight.bmi ? Number(latestWeight.bmi) : null;
          const bmiStatus = bmi ? getBMIStatus(bmi) : null;
          return (
            <motion.div
              variants={item}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2">
                  <Weight className="w-7 h-7 text-secondary" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Peso / IMC
                </p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">
                  {Number(latestWeight.weight_kg)}<span className="text-sm font-medium text-muted-foreground ml-0.5">kg</span>
                </p>
                {bmi && (
                  <>
                    <p className="text-sm font-bold text-foreground">
                      IMC {bmi.toFixed(1)}
                    </p>
                    {bmiStatus && (
                      <>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg mt-1 ${bmiStatus.bg} ${bmiStatus.color}`}>
                          {bmiStatus.label}
                        </span>
                        <p className={`text-[10px] mt-1 font-medium ${bmiStatus.color} leading-tight`}>
                          {bmiStatus.detail}
                        </p>
                      </>
                    )}
                  </>
                )}
                <span className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(latestWeight.measurement_date), "d MMM", { locale: es })}
                </span>
              </div>
            </motion.div>
          );
        })()}
      </motion.div>
    </div>
  );
};

export default VitalsSummaryCard;
