import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { formatAnoMes, formatCurrencyCompact, formatNumberCompact, formatCurrencyFull, formatNumberFull } from "../lib/format";

const METRICS = {
  VALOR: { label: "Valor (R$)", seriesName: "Valor transacionado", compact: formatCurrencyCompact, full: formatCurrencyFull },
  QUANTIDADE: { label: "Quantidade", seriesName: "Transações", compact: formatNumberCompact, full: formatNumberFull },
};

export function TrendChart({ mensal, start, end }) {
  const [metric, setMetric] = useState("VALOR");
  const cfg = METRICS[metric];

  const rows = useMemo(
    () =>
      mensal
        .filter((r) => r.AnoMes >= start && r.AnoMes <= end)
        .map((r) => ({ mes: formatAnoMes(r.AnoMes), valor: r[metric] })),
    [mensal, start, end, metric]
  );

  const tabs = (
    <div className="chart-tabs">
      {Object.entries(METRICS).map(([key, m]) => (
        <button
          key={key}
          type="button"
          className={key === metric ? "active" : ""}
          onClick={() => setMetric(key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Transações Pix liquidadas por mês"
      subtitle="Volume mensal no SPI, todo o Brasil"
      fullWidth
      tabs={tabs}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={cfg.compact}
          />
          <Tooltip
            cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            content={<ChartTooltip formatValue={cfg.full} />}
          />
          <Area
            type="monotone"
            dataKey="valor"
            name={cfg.seriesName}
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
