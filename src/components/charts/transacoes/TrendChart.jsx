import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

/**
 * Configuração por métrica.
 *
 * A métrica (Valor x Transações) vem da página como prop — é o mesmo controle
 * que rege todos os gráficos da página. O card não escolhe mais sozinho.
 */
const METRICS = {
  VALOR: {
    seriesName: "Valor transacionado",
    subtitle: "Valor mensal liquidado no SPI, todo o Brasil",
    compact: formatCurrencyCompact,
    full: formatCurrencyFull,
  },
  QUANTIDADE: {
    seriesName: "Transações",
    subtitle: "Quantidade mensal liquidada no SPI, todo o Brasil",
    compact: formatNumberCompact,
    full: formatNumberFull,
  },
};

/**
 * Transações Pix liquidadas por mês.
 *
 * Uma coluna por mês (antes era uma área contínua). A leitura passa a ser de
 * blocos mês a mês, o que casa com os demais gráficos de barra da página.
 */
export function TrendChart({ mensal, start, end, metric = "VALOR" }) {
  const cfg = METRICS[metric] ?? METRICS.VALOR;

  const rows = useMemo(
    () =>
      mensal
        .filter((r) => r.AnoMes >= start && r.AnoMes <= end)
        .sort((a, b) => a.AnoMes - b.AnoMes)
        .map((r) => ({ mes: formatAnoMes(r.AnoMes), valor: r[metric] })),
    [mensal, start, end, metric]
  );

  return (
    <ChartCard
      title="Transações Pix liquidadas por mês"
      subtitle={cfg.subtitle}
      fullWidth
    >
      <ResponsiveContainer width="100%" height={280}>
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
            tickFormatter={cfg.compact}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={cfg.full} />}
          />
          <Bar
            dataKey="valor"
            name={cfg.seriesName}
            fill="var(--series-1)"
            radius={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}