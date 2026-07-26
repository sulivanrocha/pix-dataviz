import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import {
  formatAnoMes,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatNumberCompact,
  formatNumberFull,
} from "../../../lib/format";
import { categoryLabel, categoryColor, sortByDimensionOrder } from "../../../lib/categories";

const METRIC_FORMAT = {
  VALOR: { compact: formatCurrencyCompact, full: formatCurrencyFull, label: "valor transacionado" },
  QUANTIDADE: { compact: formatNumberCompact, full: formatNumberFull, label: "transações liquidadas" },
};

function formatPercent(value) {
  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * Bloco de composição por categoria.
 *
 * Um único componente, montado duas vezes pela página:
 *   - mode="absolute" -> barras empilhadas com o valor bruto da métrica.
 *     Responde "qual o tamanho de cada categoria".
 *   - mode="share"    -> cada mês normalizado a 100%. Todas as barras têm a
 *     mesma altura e só as proporções se movem. Responde "como a composição
 *     muda no tempo" — o deslocamento de participação que a visão absoluta
 *     esconde quando o total cresce mês a mês.
 *
 * Dimensão e métrica vêm por prop; cor, rótulo e ordem reaproveitam categories.js.
 */
export function CategoryBreakdown({
  transacoes,
  start,
  end,
  dimensionKey,
  metric = "VALOR",
  mode = "absolute",
}) {
  const metricCfg = METRIC_FORMAT[metric] ?? METRIC_FORMAT.VALOR;
  const isShare = mode === "share";

  const { rows, categorias } = useMemo(() => {
    const dimData = transacoes[dimensionKey] ?? [];
    const filtered = dimData.filter((r) => r.AnoMes >= start && r.AnoMes <= end);
    const categorias = sortByDimensionOrder(
      dimensionKey,
      [...new Set(filtered.map((r) => r.categoria))]
    );

    const byMonth = new Map();
    for (const r of filtered) {
      const row = byMonth.get(r.AnoMes) ?? { AnoMes: r.AnoMes, mes: formatAnoMes(r.AnoMes) };
      row[r.categoria] = r[metric];
      byMonth.set(r.AnoMes, row);
    }

    let ordered = [...byMonth.values()].sort((a, b) => a.AnoMes - b.AnoMes);

    /*
     * No modo composição, cada categoria vira sua participação (%) no total
     * daquele mês. Todas as barras passam a somar 100 e a leitura deixa de
     * ser tamanho e passa a ser proporção.
     */
    if (isShare) {
      ordered = ordered.map((row) => {
        const total = categorias.reduce((sum, cat) => sum + (Number(row[cat]) || 0), 0);
        const out = { AnoMes: row.AnoMes, mes: row.mes };

        for (const cat of categorias) {
          const abs = Number(row[cat]) || 0;
          out[cat] = total > 0 ? (abs / total) * 100 : 0;
        }

        return out;
      });
    }

    return { rows: ordered, categorias };
  }, [transacoes, dimensionKey, metric, start, end, isShare]);

  const yTickFormatter = isShare ? (v) => `${v}%` : metricCfg.compact;
  const tooltipFormat = isShare ? formatPercent : metricCfg.full;

  const title = isShare ? "Composição por categoria (%)" : "Valor por categoria";

  const subtitle = isShare
    ? `Participação de cada categoria no ${metricCfg.label} de cada mês. Cada barra soma 100%.`
    : `Composição mensal do ${metricCfg.label}, por dimensão selecionada.`;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={isShare ? [0, 100] : undefined}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={tooltipFormat} />}
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