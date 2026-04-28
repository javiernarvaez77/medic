import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, ChevronDown, ChevronRight, Heart, Users, X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDoctorPatients } from "@/hooks/useDoctorData";

const PROGRAM_LABELS: Record<string, string> = {
  riesgo_cardiovascular: "Riesgo Cardiovascular",
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  enfermedad_renal: "Enfermedad Renal",
  enfermedad_respiratoria: "Enfermedad Respiratoria",
  tiroides: "Tiroides",
  otro: "Otro",
};

const PROGRAM_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "bg-destructive/10",
  diabetes: "bg-amber-500/10",
  hipertension: "bg-primary/10",
  enfermedad_renal: "bg-violet-500/10",
  enfermedad_respiratoria: "bg-sky-500/10",
  tiroides: "bg-emerald-500/10",
};

const PROGRAM_ICON_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "text-destructive",
  diabetes: "text-amber-500",
  hipertension: "text-primary",
  enfermedad_renal: "text-violet-500",
  enfermedad_respiratoria: "text-sky-500",
  tiroides: "text-emerald-500",
};

const PROGRAM_CHART_COLORS: Record<string, string> = {
  riesgo_cardiovascular: "hsl(0, 84%, 60%)",
  diabetes: "hsl(38, 92%, 50%)",
  hipertension: "hsl(199, 89%, 48%)",
  enfermedad_renal: "hsl(263, 70%, 50%)",
  enfermedad_respiratoria: "hsl(199, 95%, 54%)",
  tiroides: "hsl(160, 84%, 39%)",
  otro: "hsl(215, 14%, 70%)",
};

const PATIENTS_PER_PAGE = 20;

const PatientsByProgramSection = () => {
  const navigate = useNavigate();
  const { data: patients } = useDoctorPatients();
  const [programsOpen, setProgramsOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [patientPage, setPatientPage] = useState(0);
  const [patientSearch, setPatientSearch] = useState("");

  const patientsByProgram = (patients ?? []).reduce<Record<string, typeof patients>>((acc, p) => {
    const progs = p.programs ?? [];
    progs.forEach((prog: string) => {
      if (prog && prog !== "otro") {
        if (!acc[prog]) acc[prog] = [];
        acc[prog]!.push(p);
      }
    });
    return acc;
  }, {});
  const programEntries = Object.entries(patientsByProgram);
  const noProgramPatients = (patients ?? []).filter((p) => !p.programs || p.programs.length === 0);

  const chartData = [
    ...programEntries.map(([prog, pts]) => ({
      name: PROGRAM_LABELS[prog] ?? prog,
      value: pts!.length,
      color: PROGRAM_CHART_COLORS[prog] ?? "hsl(215, 14%, 70%)",
    })),
    ...(noProgramPatients.length > 0
      ? [{ name: "Sin programa", value: noProgramPatients.length, color: PROGRAM_CHART_COLORS.otro }]
      : []),
  ];

  if ((patients ?? []).length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setProgramsOpen(!programsOpen)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Pacientes por Programa
          </h2>
          {programsOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-card mb-3">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cursor="pointer"
                      onClick={(_data: any, index: number) => {
                        const entry = chartData[index];
                        const key = entry.name === "Sin programa" ? "sin_programa" :
                          Object.entries(PROGRAM_LABELS).find(([, v]) => v === entry.name)?.[0] ?? null;
                        setSelectedProgram(prev => prev === key ? null : key);
                        setPatientPage(0);
                        setPatientSearch("");
                      }}
                    >
                      {chartData.map((entry, index) => {
                        const key = entry.name === "Sin programa" ? "sin_programa" :
                          Object.entries(PROGRAM_LABELS).find(([, v]) => v === entry.name)?.[0] ?? null;
                        const isSelected = selectedProgram === key;
                        return (
                          <Cell
                            key={index}
                            fill={entry.color}
                            opacity={selectedProgram === null || isSelected ? 1 : 0.3}
                            strokeWidth={isSelected ? 2 : 0}
                            stroke={isSelected ? entry.color : "none"}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} paciente${value !== 1 ? "s" : ""}`, name]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {chartData.map((entry, i) => {
                  const key = entry.name === "Sin programa" ? "sin_programa" :
                    Object.entries(PROGRAM_LABELS).find(([, v]) => v === entry.name)?.[0] ?? null;
                  const isSelected = selectedProgram === key;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedProgram(prev => prev === key ? null : key); setPatientPage(0); setPatientSearch(""); }}
                      className={`flex items-center gap-2 text-xs w-full rounded-lg px-1.5 py-1 transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color, opacity: selectedProgram === null || isSelected ? 1 : 0.3 }} />
                      <span className={`truncate ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{entry.name}</span>
                      <span className="ml-auto font-semibold text-foreground">{entry.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedProgram && (
              <p className="text-xs text-primary mt-2 text-center font-medium">
                Mostrando: {selectedProgram === "sin_programa" ? "Sin programa" : PROGRAM_LABELS[selectedProgram] ?? selectedProgram}
                <button onClick={() => { setSelectedProgram(null); setPatientPage(0); setPatientSearch(""); }} className="ml-2 text-muted-foreground hover:text-destructive">✕</button>
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {programsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {programEntries.length > 0 ? (
                <div className="space-y-2">
                  {programEntries.map(([program, pts]) => (
                    <div
                      key={program}
                      className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${PROGRAM_COLORS[program] ?? "bg-muted"}`}>
                        <Heart className={`w-4 h-4 ${PROGRAM_ICON_COLORS[program] ?? "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{PROGRAM_LABELS[program] ?? program}</p>
                        <p className="text-xs text-muted-foreground">{pts!.length} paciente{pts!.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex -space-x-1">
                        {pts!.slice(0, 3).map((p) => (
                          <div key={p.user_id} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-card">
                            {p.full_name?.charAt(0) ?? "?"}
                          </div>
                        ))}
                        {pts!.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground border-2 border-card">
                            +{pts!.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {noProgramPatients.length > 0 && (
                    <div className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Sin programa asignado</p>
                        <p className="text-xs text-muted-foreground">{noProgramPatients.length} paciente{noProgramPatients.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pacientes con programa crónico asignado.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {selectedProgram && (() => {
        const basePatients = selectedProgram === "sin_programa"
          ? noProgramPatients
          : patientsByProgram[selectedProgram] ?? [];
        const searchLower = patientSearch.toLowerCase().trim();
        const filteredPatients = searchLower
          ? basePatients!.filter(p =>
              p.full_name?.toLowerCase().includes(searchLower) ||
              p.document_id?.toLowerCase().includes(searchLower)
            )
          : basePatients!;
        const totalPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE);
        const paginatedPatients = filteredPatients.slice(patientPage * PATIENTS_PER_PAGE, (patientPage + 1) * PATIENTS_PER_PAGE);
        const programLabel = selectedProgram === "sin_programa" ? "Sin programa" : PROGRAM_LABELS[selectedProgram] ?? selectedProgram;

        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {programLabel} ({filteredPatients.length})
              </h2>
              <button
                onClick={() => { setSelectedProgram(null); setPatientPage(0); setPatientSearch(""); }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cerrar
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); setPatientPage(0); }}
                placeholder="Buscar por nombre o documento..."
                className="w-full text-sm bg-muted rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {filteredPatients.length > 0 ? (
              <div className="space-y-2">
                {paginatedPatients.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => navigate(`/pacientes?patient=${p.user_id}`)}
                    className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 hover:bg-muted/40 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.document_id ?? "Sin documento"} {p.eps ? `• ${p.eps}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setPatientPage(p => Math.max(0, p - 1))}
                      disabled={patientPage === 0}
                      className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground disabled:opacity-40 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {patientPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPatientPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={patientPage >= totalPages - 1}
                      className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground disabled:opacity-40 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay pacientes en este programa.</p>
            )}
          </motion.div>
        );
      })()}
    </>
  );
};

export default PatientsByProgramSection;
