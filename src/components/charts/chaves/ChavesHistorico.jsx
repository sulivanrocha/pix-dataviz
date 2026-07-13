import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { CsvDownloadButton } from "../../shared/CsvDownloadButton";
import {
  formatAnoMes,
  formatNumberCompact,
  formatNumberFull,
} from "../../../lib/format";
import { categoryColor } from "../../../lib/categories";

function HistoryChart({
  title,
  rows,
  dataKey,
  color,
  barSize,
  categoryGap,
  tickInterval,
}) {
  return (
    <section className="keys-history-panel">
      <h3
        className="keys-history-panel__title"
        style={{ color }}
      >
        {title}
      </h3>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart
          data={rows}
          margin={{
            top: 8,
            right: 12,
            left: 4,
            bottom: 0,
          }}
          barCategoryGap={categoryGap}
        >
          <CartesianGrid
            stroke="var(--gridline)"
            vertical={false}
          />

          <XAxis
            dataKey="mes"
            tick={{
              fontSize: 11,
              fill: "var(--text-muted)",
            }}
            axisLine={{
              stroke: "var(--baseline)",
            }}
            tickLine={false}
            interval={tickInterval}
          />

          <YAxis
            tick={{
              fontSize: 11,
              fill: "var(--text-muted)",
            }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={formatNumberCompact}
          />

          <Tooltip
            cursor={{
              fill: "var(--gridline)",
              opacity: 0.35,
            }}
            content={
              <ChartTooltip
                formatValue={formatNumberFull}
              />
            }
          />

          <Bar
            dataKey={dataKey}
            name={title}
            fill={color}
            radius={[3, 3, 0, 0]}
            barSize={barSize}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function ChavesHistorico({
  historico,
}) {
  const rows = useMemo(
    () =>
      historico.map((record) => ({
        data: record.data,
        mes: formatAnoMes(
          Number(
            record.data
              .slice(0, 7)
              .replace("-", "")
          )
        ),
        PF: Number(record.PF) || 0,
        PJ: Number(record.PJ) || 0,
        total:
          Number(record.total) ||
          (Number(record.PF) || 0) +
            (Number(record.PJ) || 0),
      })),
    [historico]
  );

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Mês: row.mes,
        Data: row.data,
        "Pessoa física": row.PF,
        "Pessoa jurídica": row.PJ,
        Total: row.total,
      })),
    [rows]
  );

  const months = rows.length;

  const tickInterval = Math.max(
    Math.ceil(months / 6) - 1,
    0
  );

  const barSize =
    months <= 3
      ? 56
      : months <= 6
        ? 42
        : months <= 12
          ? 28
          : months <= 24
            ? 18
            : 12;

  const categoryGap =
    months <= 6
      ? "6%"
      : months <= 12
        ? "12%"
        : "24%";

  return (
    <ChartCard
      title="Evolução das chaves Pix cadastradas"
      subtitle="Estoque mensal de chaves de pessoas físicas e jurídicas"
      fullWidth
      tabs={
        <CsvDownloadButton
          data={exportRows}
          filename="historico-chaves-pix.csv"
        />
      }
    >
      <div className="keys-history-grid">
        <HistoryChart
          title="Pessoa física"
          rows={rows}
          dataKey="PF"
          color={categoryColor(
            "porPFPJPagador",
            "PF"
          )}
          barSize={barSize}
          categoryGap={categoryGap}
          tickInterval={tickInterval}
        />

        <HistoryChart
          title="Pessoa jurídica"
          rows={rows}
          dataKey="PJ"
          color={categoryColor(
            "porPFPJPagador",
            "PJ"
          )}
          barSize={barSize}
          categoryGap={categoryGap}
          tickInterval={tickInterval}
        />
      </div>

      <style>
        {`
          .keys-history-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
          }

          .keys-history-panel {
            min-width: 0;
          }

          .keys-history-panel__title {
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 600;
          }

          @media (max-width: 800px) {
            .keys-history-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }
        `}
      </style>
    </ChartCard>
  );
}