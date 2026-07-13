import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull } from "../lib/format";
import { DIMENSIONS, categoryLabel, categoryColor, sortByDimensionOrder } from "../lib/categories";

const DIMENSION_KEYS = Object.keys(DIMENSIONS);

export function CategoryBreakdown({ transacoes, start, end }) {
  const [dimensionKey, setDimensionKey] = useState("porNatureza");
  const dimData = transacoes[dimensionKey];

  const { rows, categorias } = useMemo(() => {
    const filtered = dimData.filter((r) => r.AnoMes >= start && r.AnoMes <= end);
    const categorias = sortByDimensionOrder(dimensionKey, [...new Set(filtered.map((r) => r.categoria))]);

    const byMonth = new Map();
    for (const r of filtered) {
      const row = byMonth.get(r.AnoMes) ?? { AnoMes: r.AnoMes, mes: formatAnoMes(r.AnoMes) };
      row[r.categoria] = r.VALOR;
      byMonth.set(r.AnoMes, row);
    }

    return {
      rows: [...byMonth.values()].sort((a, b) => a.AnoMes - b.AnoMes),
      categorias,
    };
  }, [dimData, dimensionKey, start, end]);

  const tabs = (
    <div className="chart-tabs">
      {DIMENSION_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={key === dimensionKey ? "active" : ""}
          onClick={() => setDimensionKey(key)}
        >
          {DIMENSIONS[key].label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Valor transacionado por categoria"
      subtitle="Composição mensal do volume financeiro, por dimensão selecionada"
      fullWidth
      tabs={tabs}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={formatCurrencyCompact}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={formatCurrencyFull} />}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
            itemSorter={() => 0}
          />
          {categorias.map((cat) => (
            <Bar
              key={cat}
              dataKey={cat}
              name={categoryLabel(dimensionKey, cat)}
              stackId="total"
              fill={categoryColor(dimensionKey, cat)}
              radius={0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
