import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { formatCurrencyCompact, formatCurrencyFull } from "../lib/format";

const TOP_N = 12;

function toTitleCase(s) {
  return s.replace(/\S+/g, (w) => w[0] + w.slice(1).toLowerCase());
}

export function StateRanking({ porEstadoMensal, start, end }) {
  const rows = useMemo(() => {
    const filtered = porEstadoMensal.filter((r) => r.AnoMes >= start && r.AnoMes <= end);
    const byState = new Map();
    for (const r of filtered) {
      const valorPago = r.VL_PagadorPF + r.VL_PagadorPJ;
      byState.set(r.Estado, (byState.get(r.Estado) ?? 0) + valorPago);
    }
    return [...byState.entries()]
      .map(([estado, valor]) => ({ estado: toTitleCase(estado), valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N)
      .reverse();
  }, [porEstadoMensal, start, end]);

  return (
    <ChartCard
      title={`Top ${TOP_N} estados por valor enviado`}
      subtitle="Soma do valor pago (PF + PJ) pelos usuários do estado, no período filtrado"
      fullWidth
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrencyCompact}
          />
          <YAxis
            type="category"
            dataKey="estado"
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            width={140}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={formatCurrencyFull} />}
          />
          <Bar dataKey="valor" name="Valor enviado" radius={[0, 4, 4, 0]}>
            {rows.map((r) => (
              <Cell key={r.estado} fill="var(--series-1)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
