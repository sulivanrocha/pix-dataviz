import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { formatCurrencyCompact, formatCurrencyFull } from "../../../lib/format";

const TOP_N = 12;

function toTitleCase(s) {
  return s.replace(/\S+/g, (w) => w[0] + w.slice(1).toLowerCase());
}

function valorFields(perspectiva, segmento) {
  if (segmento === "Todos") {
    return [`VL_${perspectiva}PF`, `VL_${perspectiva}PJ`];
  }
  return [`VL_${perspectiva}${segmento}`];
}

const PERSPECTIVA_LABEL = {
  Pagador: "pago",
  Recebedor: "recebido",
};

const SEGMENTO_LABEL = {
  Todos: "PF + PJ",
  PF: "pessoa física",
  PJ: "pessoa jurídica",
};

export function StateRanking({
  porEstadoMensal,
  start,
  end,
  regiao = "Todas",
  perspectiva = "Pagador",
  segmento = "Todos",
}) {
  const fields = valorFields(perspectiva, segmento);

  const rows = useMemo(() => {
    const filtered = porEstadoMensal.filter(
      (r) => r.AnoMes >= start && r.AnoMes <= end && (regiao === "Todas" || r.Regiao === regiao)
    );
    const byState = new Map();
    for (const r of filtered) {
      const valor = fields.reduce((sum, field) => sum + (Number(r[field]) || 0), 0);
      byState.set(r.Estado, (byState.get(r.Estado) ?? 0) + valor);
    }
    return [...byState.entries()]
      .map(([estado, valor]) => ({ estado: toTitleCase(estado), valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N)
      .reverse();
  }, [porEstadoMensal, start, end, regiao, fields.join(",")]);

  return (
    <ChartCard
      title={`Top ${TOP_N} estados por valor ${PERSPECTIVA_LABEL[perspectiva]}`}
      subtitle={`Soma do valor ${SEGMENTO_LABEL[segmento]} (perspectiva ${perspectiva.toLowerCase()}), no período filtrado`}
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
            tickFormatter={formatCurrencyCompact}
          />
          <YAxis
            type="category"
            dataKey="estado"
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            width={140}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
            content={<ChartTooltip formatValue={formatCurrencyFull} />}
          />
          <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]}>
            {rows.map((r) => (
              <Cell key={r.estado} fill="var(--series-1)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}