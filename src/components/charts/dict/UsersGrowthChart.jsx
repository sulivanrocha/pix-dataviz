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

export function UsersGrowthChart({ usuariosDict }) {
  const rows = useMemo(
    () =>
      usuariosDict.map((r) => ({
        mes: formatAnoMes(
          Number(r.data.slice(0, 7).replace("-", ""))
        ),
        pessoaFisica: r.pessoaFisica,
        pessoaJuridica: r.pessoaJuridica,
      })),
    [usuariosDict]
  );

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Mes: row.mes,
        "Pessoa física": row.pessoaFisica,
        "Pessoa jurídica": row.pessoaJuridica,
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
      title="Usuários cadastrados no DICT"
      subtitle="Evolução mensal de pessoas físicas e jurídicas desde o lançamento do Pix"
      fullWidth
      tabs={
        <CsvDownloadButton
          data={exportRows}
          filename="usuarios-dict.csv"
        />
      }
    >
      <div className="users-growth-grid">
        <section className="users-growth-panel">
          <h3
            className="users-growth-panel__title"
            style={{ color: "var(--series-1)" }}
          >
            Pessoa física
          </h3>

          <ResponsiveContainer width="100%" height={300}>
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
                width={50}
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
                dataKey="pessoaFisica"
                name="Pessoa física"
                fill="var(--series-1)"
                radius={[3, 3, 0, 0]}
                barSize={barSize}
                animationDuration={700}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="users-growth-panel">
          <h3
            className="users-growth-panel__title"
            style={{ color: "var(--series-2)" }}
          >
            Pessoa jurídica
          </h3>

          <ResponsiveContainer width="100%" height={300}>
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
                width={50}
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
                dataKey="pessoaJuridica"
                name="Pessoa jurídica"
                fill="var(--series-2)"
                radius={[3, 3, 0, 0]}
                barSize={barSize}
                animationDuration={700}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <style>
        {`
          .users-growth-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
          }

          .users-growth-panel {
            min-width: 0;
          }

          .users-growth-panel__title {
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 600;
          }

          @media (max-width: 800px) {
            .users-growth-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }
        `}
      </style>
    </ChartCard>
  );
}