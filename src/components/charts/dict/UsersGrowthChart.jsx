import { useMemo } from "react";
import {
  AreaChart,
  Area,
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
        mes: formatAnoMes(Number(r.data.slice(0, 7).replace("-", ""))),
        pessoaFisica: r.pessoaFisica,
        pessoaJuridica: r.pessoaJuridica,
      })),
    [usuariosDict]
  );

  return (
    <ChartCard
      title="Usuários cadastrados no DICT"
      subtitle="Evolução mensal de pessoas físicas e jurídicas desde o lançamento do Pix"
      fullWidth
    >
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="pessoaFisicaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--series-1)"
                stopOpacity={0.75}
              />
              <stop
                offset="95%"
                stopColor="var(--series-1)"
                stopOpacity={0.15}
              />
            </linearGradient>

            <linearGradient id="pessoaJuridicaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--series-2)"
                stopOpacity={0.75}
              />
              <stop
                offset="95%"
                stopColor="var(--series-2)"
                stopOpacity={0.15}
              />
            </linearGradient>
          </defs>

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
            interval={Math.max(Math.ceil(rows.length / 9) - 1, 0)}
          />

          <YAxis
            tick={{
              fontSize: 11,
              fill: "var(--text-muted)",
            }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={formatNumberCompact}
          />

          <Tooltip
            cursor={{
              stroke: "var(--baseline)",
              strokeWidth: 1,
            }}
            content={
              <ChartTooltip
                formatValue={formatNumberFull}
              />
            }
          />

          <Legend
            wrapperStyle={{ fontSize: 12 }}
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

          <Area
            type="monotone"
            dataKey="pessoaFisica"
            name="Pessoa física"
            stackId="usuarios"
            stroke="var(--series-1)"
            fill="url(#pessoaFisicaGradient)"
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />

          <Area
            type="monotone"
            dataKey="pessoaJuridica"
            name="Pessoa jurídica"
            stackId="usuarios"
            stroke="var(--series-2)"
            fill="url(#pessoaJuridicaGradient)"
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}