import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
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

  const tickInterval = Math.max(
    Math.ceil(rows.length / 9) - 1,
    0
  );

  return (
    <ChartCard
      title="Usuários cadastrados no DICT"
      subtitle="Evolução mensal de pessoas físicas e jurídicas desde o lançamento do Pix"
      fullWidth
    >
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={rows}
          margin={{
            top: 12,
            right: 20,
            left: 8,
            bottom: 0,
          }}
          barGap={1}
          barCategoryGap="20%"
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
            yAxisId="pf"
            orientation="left"
            tick={{
              fontSize: 11,
              fill: "var(--series-1)",
            }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={formatNumberCompact}
          />

          <YAxis
            yAxisId="pj"
            orientation="right"
            tick={{
              fontSize: 11,
              fill: "var(--series-2)",
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

          <Legend
            verticalAlign="top"
            align="left"
            wrapperStyle={{
              fontSize: 12,
              paddingBottom: 16,
            }}
            formatter={(value) => (
              <span
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                {value}
              </span>
            )}
            itemSorter={() => 0}
          />

          <Bar
            yAxisId="pf"
            dataKey="pessoaFisica"
            name="Pessoa física — eixo esquerdo"
            fill="var(--series-1)"
            radius={[3, 3, 0, 0]}
            maxBarSize={12}
            animationDuration={700}
          />

          <Bar
            yAxisId="pj"
            dataKey="pessoaJuridica"
            name="Pessoa jurídica — eixo direito"
            fill="var(--series-2)"
            radius={[3, 3, 0, 0]}
            maxBarSize={12}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
