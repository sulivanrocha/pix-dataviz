import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { CsvDownloadButton } from "../../shared/CsvDownloadButton";
import {
  formatNumberCompact,
  formatNumberFull,
} from "../../../lib/format";
import { categoryColor } from "../../../lib/categories";

function ParticipantChart({
  title,
  rows,
  dataKey,
  color,
}) {
  const chartHeight = Math.max(320, rows.length * 34);

  return (
    <section className="participant-chart-panel">
      <h3
        className="participant-chart-panel__title"
        style={{ color }}
      >
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{
            top: 4,
            right: 20,
            left: 8,
            bottom: 0,
          }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            stroke="var(--gridline)"
            horizontal={false}
          />

          <XAxis
            type="number"
            tick={{
              fontSize: 11,
              fill: "var(--text-muted)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumberCompact}
          />

          <YAxis
            type="category"
            dataKey="participante"
            tick={{
              fontSize: 11,
              fill: "var(--text-secondary)",
            }}
            axisLine={{
              stroke: "var(--baseline)",
            }}
            tickLine={false}
            width={170}
          />

          <Tooltip
            cursor={{
              fill: "var(--gridline)",
              opacity: 0.4,
            }}
            content={
              <ChartTooltip
                formatValue={formatNumberFull}
              />
            }
          />

          <Bar
            dataKey={dataKey}
            name="Número de chaves"
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function ChavesPorParticipante({
  data,
  porParticipante,
  topN = 10,
}) {
  const rowsPF = useMemo(
    () =>
      [...porParticipante]
        .filter((row) => Number(row.PF) > 0)
        .sort((a, b) => Number(b.PF) - Number(a.PF))
        .slice(0, topN)
        .reverse(),
    [porParticipante, topN]
  );

  const rowsPJ = useMemo(
    () =>
      [...porParticipante]
        .filter((row) => Number(row.PJ) > 0)
        .sort((a, b) => Number(b.PJ) - Number(a.PJ))
        .slice(0, topN)
        .reverse(),
    [porParticipante, topN]
  );

  const exportRows = useMemo(() => {
    const exportPF = [...rowsPF]
      .reverse()
      .map((row, index) => ({
        Tipo: "Pessoa física",
        Ranking: index + 1,
        Participante: row.participante,
        Chaves: row.PF,
      }));

    const exportPJ = [...rowsPJ]
      .reverse()
      .map((row, index) => ({
        Tipo: "Pessoa jurídica",
        Ranking: index + 1,
        Participante: row.participante,
        Chaves: row.PJ,
      }));

    return [...exportPF, ...exportPJ];
  }, [rowsPF, rowsPJ]);

  const referenceDate = new Date(
    `${data}T00:00:00`
  ).toLocaleDateString("pt-BR");

  return (
    <ChartCard
      title={`Top ${topN} participantes por chaves Pix cadastradas`}
      subtitle={`Estoque em ${referenceDate}, com rankings separados para pessoas físicas e jurídicas`}
      fullWidth
      tabs={
        <CsvDownloadButton
          data={exportRows}
          filename={`chaves-pix-por-participante-${data}.csv`}
        />
      }
    >
      <div className="participant-charts-grid">
        <ParticipantChart
          title="Pessoa física"
          rows={rowsPF}
          dataKey="PF"
          color={categoryColor("porPFPJPagador", "PF")}
        />

        <ParticipantChart
          title="Pessoa jurídica"
          rows={rowsPJ}
          dataKey="PJ"
          color={categoryColor("porPFPJPagador", "PJ")}
        />
      </div>

      <p className="participant-charts-axis-label">
        Número de chaves cadastradas
      </p>

      <style>
        {`
          .participant-charts-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 28px;
            align-items: start;
          }

          .participant-chart-panel {
            min-width: 0;
          }

          .participant-chart-panel__title {
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 600;
          }

          .participant-charts-axis-label {
            margin: 8px 0 0;
            text-align: center;
            color: var(--text-muted);
            font-size: 12px;
          }

          @media (max-width: 1000px) {
            .participant-charts-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }

          @media (max-width: 640px) {
            .participant-chart-panel .recharts-yAxis {
              font-size: 10px;
            }
          }
        `}
      </style>
    </ChartCard>
  );
}