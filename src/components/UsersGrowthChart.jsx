import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { formatAnoMes, formatNumberCompact, formatNumberFull } from "../lib/format";

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
      subtitle="Estoque mensal, desde o lançamento do Pix (histórico completo)"
      fullWidth
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            interval={Math.ceil(rows.length / 9) - 1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={formatNumberCompact}
          />
          <Tooltip
            cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            content={<ChartTooltip formatValue={formatNumberFull} />}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
            itemSorter={() => 0}
          />
          <Line type="monotone" dataKey="pessoaFisica" name="Pessoa física" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="pessoaJuridica" name="Pessoa jurídica" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
