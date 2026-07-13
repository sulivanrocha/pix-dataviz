import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { formatNumberCompact, formatNumberFull } from "../lib/format";
import { categoryLabel, categoryColor } from "../lib/categories";

const TIPO_LABEL = { total: "pessoa física e jurídica", PF: "pessoa física", PJ: "pessoa jurídica" };

export function ChavesPorParticipante({ data, porParticipante, topN = 10, tipo = "total" }) {
  const sortKey = tipo === "total" ? "total" : tipo;

  const rows = useMemo(
    () =>
      [...porParticipante]
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, topN)
        .reverse(),
    [porParticipante, sortKey, topN]
  );

  return (
    <ChartCard
      title={`Top ${topN} participantes por chaves Pix cadastradas`}
      subtitle={`Estoque em ${new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}, aberto por ${TIPO_LABEL[tipo]}`}
      fullWidth
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumberCompact}
          />
          <YAxis
            type="category"
            dataKey="participante"
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            width={200}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={formatNumberFull} />}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
            itemSorter={() => 0}
          />
          {tipo !== "PJ" && (
            <Bar
              dataKey="PF"
              name={categoryLabel("porPFPJPagador", "PF")}
              stackId="chaves"
              fill={categoryColor("porPFPJPagador", "PF")}
              radius={tipo === "PF" ? [0, 4, 4, 0] : 0}
            />
          )}
          {tipo !== "PF" && (
            <Bar
              dataKey="PJ"
              name={categoryLabel("porPFPJPagador", "PJ")}
              stackId="chaves"
              fill={categoryColor("porPFPJPagador", "PJ")}
              radius={[0, 4, 4, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
        Número de chaves
      </p>
    </ChartCard>
  );
}
