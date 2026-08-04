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
import { Filters } from "../../shared/Filters";
import {
  formatAnoMes,
  formatNumberCompact,
  formatNumberFull,
} from "../../../lib/format";
import { useI18n } from "../../../lib/i18n/I18nContext";

export function UsersGrowthChart({
  usuariosDict,
  months,
  start,
  end,
  onStartChange,
  onEndChange,
}) {
  const { t } = useI18n();
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
        [t("common.referenceMonth")]: row.mes,
        [t("pfpj.pf")]: row.pessoaFisica,
        [t("pfpj.pj")]: row.pessoaJuridica,
      })),
    [rows, t]
  );

  const monthCount = rows.length;

  const tickInterval = Math.max(
    Math.ceil(monthCount / 6) - 1,
    0
  );

  const barSize =
    monthCount <= 3
      ? 56
      : monthCount <= 6
        ? 42
        : monthCount <= 12
          ? 28
          : monthCount <= 24
            ? 18
            : 12;

  const categoryGap =
    monthCount <= 6
      ? "6%"
      : monthCount <= 12
        ? "12%"
        : "24%";

  return (
    <ChartCard
      title={t("dictPage.chartTitle")}
      subtitle={t("dictPage.chartSubtitle")}
      fullWidth
      tabs={
        <div className="users-growth-controls">
          <Filters
            months={months}
            start={start}
            end={end}
            onStartChange={onStartChange}
            onEndChange={onEndChange}
          />

          <CsvDownloadButton
            data={exportRows}
            filename="usuarios-dict.csv"
          />
        </div>
      }
    >
      <div className="users-growth-grid">
        <section className="users-growth-panel">
          <h3
            className="users-growth-panel__title"
            style={{ color: "var(--series-1)" }}
          >
            {t("pfpj.pf")}
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
                name={t("pfpj.pf")}
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
            {t("pfpj.pj")}
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
                name={t("pfpj.pj")}
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

          .users-growth-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
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