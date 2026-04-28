import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measurement_time: string;
}

interface GlucoseReading {
  id: string;
  value: number;
  meal_context: string;
  measurement_time: string;
}

interface WeightRecord {
  id: string;
  weight_kg: number;
  bmi: number;
  measurement_date: string;
}

const chartMargin = { top: 8, right: 8, left: -20, bottom: 0 };

const CustomTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  padding: "8px 12px",
  fontSize: "12px",
};

export const BPChart = ({ data }: { data: BPReading[] }) => {
  const chartData = [...data]
    .reverse()
    .map((r) => ({
      date: format(new Date(r.measurement_time), "dd/MM", { locale: es }),
      fullDate: format(new Date(r.measurement_time), "dd MMM, HH:mm", { locale: es }),
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse,
    }));

  if (chartData.length < 2) return null;

  return (
    <div className="bg-card rounded-xl p-3 shadow-card mb-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Evolución de Presión Arterial</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={CustomTooltipStyle}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = { systolic: "Sistólica", diastolic: "Diastólica", pulse: "Pulso" };
              const units: Record<string, string> = { systolic: "mmHg", diastolic: "mmHg", pulse: "lpm" };
              return [`${value} ${units[name] ?? ""}`, labels[name] ?? name];
            }}
          />
          <ReferenceLine y={120} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine y={80} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Line type="monotone" dataKey="systolic" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="systolic" />
          <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="diastolic" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-destructive rounded" /> Sistólica
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-primary rounded" /> Diastólica
        </span>
      </div>
    </div>
  );
};

export const GlucoseChart = ({ data }: { data: GlucoseReading[] }) => {
  const chartData = [...data]
    .reverse()
    .map((r) => ({
      date: format(new Date(r.measurement_time), "dd/MM", { locale: es }),
      fullDate: format(new Date(r.measurement_time), "dd MMM, HH:mm", { locale: es }),
      value: Number(r.value),
      context: r.meal_context,
    }));

  if (chartData.length < 2) return null;

  return (
    <div className="bg-card rounded-xl p-3 shadow-card mb-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Evolución de Glucosa</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={chartMargin}>
          <defs>
            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={CustomTooltipStyle}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
            formatter={(value: number) => [`${value} mg/dL`, "Glucosa"]}
          />
          <ReferenceLine y={180} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Alto", fontSize: 9, fill: "hsl(var(--destructive))" }} />
          <ReferenceLine y={70} stroke="hsl(var(--warning, 45 93% 47%))" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Bajo", fontSize: 9, fill: "hsl(45, 93%, 47%)" }} />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#glucoseGradient)" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeightBMIChart = ({ data }: { data: WeightRecord[] }) => {
  const chartData = [...data]
    .reverse()
    .map((r) => ({
      date: format(new Date(r.measurement_date), "dd/MM", { locale: es }),
      fullDate: format(new Date(r.measurement_date), "dd MMM yyyy", { locale: es }),
      weight: Number(r.weight_kg),
      bmi: Number(Number(r.bmi).toFixed(1)),
    }));

  if (chartData.length < 2) return null;

  return (
    <div className="bg-card rounded-xl p-3 shadow-card mb-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Evolución de Peso e IMC</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis yAxisId="weight" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
          <YAxis yAxisId="bmi" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={CustomTooltipStyle}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
            formatter={(value: number, name: string) => {
              if (name === "weight") return [`${value} kg`, "Peso"];
              return [value, "IMC"];
            }}
          />
          <ReferenceLine yAxisId="bmi" y={25} stroke="hsl(var(--warning, 45 93% 47%))" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine yAxisId="bmi" y={30} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="weight" />
          <Line yAxisId="bmi" type="monotone" dataKey="bmi" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="bmi" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-primary rounded" /> Peso (kg)
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-secondary rounded" /> IMC
        </span>
      </div>
    </div>
  );
};
