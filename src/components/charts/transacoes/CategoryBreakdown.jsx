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
import { categoryLabel, categoryColor } from "../../../lib/categories";
import { getFormatLang } from "../../../lib/format";
import { useI18n } from "../../../lib/i18n/I18nContext";

const METRIC_FORMAT = {
  VALOR: {
    compact: formatCurrencyCompact,
    full: formatCurrencyFull,
    labelKey: "transacoesPage.breakdownMetricValue",
  },
  QUANTIDADE: {
    compact: formatNumberCompact,
    full: formatNumberFull,
    labelKey: "transacoesPage.breakdownMetricCount",
  },
};

const SHARE_TICKS = [0, 25, 50, 75, 100];

function formatPercent(value) {
  const locale = getFormatLang() === "en" ? "en-US" : "pt-BR";
  return `${Number(value).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/*
 * Categorias "Nao disponivel"/"Nao informado" seguem a convencao do
 * categories.js (prefixo "Nao") e sao suprimidas do grafico: nao ocupam
 * fatia da pilha nem entram no total do modo composicao, para que as barras
 * de % somem exatamente 100 entre as categorias reais.
 */
function isMuted(categoria) {
  return String(categoria).startsWith("Nao");
}

export function CategoryBreakdown({
  transacoes,
  start,
  end,
  dimensionKey,
  metric = "VALOR",
  mode = "absolute",
}) {
  const { t, lang } = useI18n();
  const metricCfg = METRIC_FORMAT[metric] ?? METRIC_FORMAT.VALOR;
  const isShare = mode === "share";

  const { rows, categorias } = useMemo(() => {
    const dimData = transacoes[dimensionKey] ?? [];

    /*
     * Ordem da pilha: maior embaixo, decrescente para cima. O ranking usa o
     * ultimo mes disponivel na base (independente do filtro De/Ate) e a metrica
     * em exibicao — assim a ordem e estavel ao longo de todos os meses do grafico
     * e igual nos dois cards (absoluto e composicao).
     */
    const refMonth = dimData.reduce(
      (max, r) => (r.AnoMes > max ? r.AnoMes : max),
      -Infinity
    );

    const refTotals = new Map();
    for (const r of dimData) {
      if (r.AnoMes === refMonth && !isMuted(r.categoria)) {
        refTotals.set(r.categoria, (refTotals.get(r.categoria) ?? 0) + (Number(r[metric]) || 0));
      }
    }

    const filtered = dimData.filter(
      (r) => r.AnoMes >= start && r.AnoMes <= end && !isMuted(r.categoria)
    );

    const categorias = [...new Set(filtered.map((r) => r.categoria))].sort(
      (a, b) => (refTotals.get(b) ?? 0) - (refTotals.get(a) ?? 0)
    );

    const byMonth = new Map();
    for (const r of filtered) {
      const row = byMonth.get(r.AnoMes) ?? { AnoMes: r.AnoMes, mes: formatAnoMes(r.AnoMes) };
      row[r.categoria] = r[metric];
      byMonth.set(r.AnoMes, row);
    }

    let ordered = [...byMonth.values()].sort((a, b) => a.AnoMes - b.AnoMes);

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

  const yTickFormatter = isShare
    ? (v) => `${Math.round(v)}%`
    : metricCfg.compact;

  const tooltipFormat = isShare ? formatPercent : metricCfg.full;

  const metricLabel = t(metricCfg.labelKey);
  const title = isShare
    ? t("transacoesPage.breakdownShareTitle")
    : t("transacoesPage.breakdownValueTitle");

  const subtitle = isShare
    ? t("transacoesPage.breakdownSubShare", { metric: metricLabel })
    : t("transacoesPage.breakdownSubAbsolute", { metric: metricLabel });

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
            ticks={isShare ? SHARE_TICKS : undefined}
            allowDataOverflow={isShare}
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
              name={categoryLabel(dimensionKey, cat, lang)}
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