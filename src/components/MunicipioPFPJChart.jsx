import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./shared/ChartCard";
import { ChartTooltip } from "./shared/ChartTooltip";
import { formatAnoMes, formatCurrencyCompact, formatNumberCompact, formatCurrencyFull, formatNumberFull } from "../lib/format";

const METRICS = {
  VALOR: { label: "Valor (R$)", field: "VL_Pagador", compact: formatCurrencyCompact, full: formatCurrencyFull },
  QUANTIDADE: { label: "Transações", field: "QT_Pagador", compact: formatNumberCompact, full: formatNumberFull },
  PESSOAS: { label: "Pessoas", field: "QT_PES_Pagador", compact: formatNumberCompact, full: formatNumberFull },
};

const TIPO_LABEL = { PF: "Pessoa Física", PJ: "Pessoa Jurídica" };
const TIPO_COLOR = { PF: "var(--series-1)", PJ: "var(--series-2)" };

// Série mensal PF ou PJ (pagador) do município selecionado. serieMensal já
// deve vir filtrada para um único Municipio_Ibge — ver MunicipioSelector.
export function MunicipioPFPJChart({ serieMensal, tipo }) {
  const [metric, setMetric] = useState("VALOR");
  const cfg = METRICS[metric];
  const fieldKey = `${cfg.field}${tipo}`;
  const color = TIPO_COLOR[tipo];

  const rows = useMemo(
    () => serieMensal.map((r) => ({ mes: formatAnoMes(r.AnoMes), valor: r[fieldKey] })),
    [serieMensal, fieldKey]
  );

  const tabs = (
    <div className="chart-tabs">
      {Object.entries(METRICS).map(([key, m]) => (
        <button
          key={key}
          type="button"
          className={key === metric ? "active" : ""}
          onClick={() => setMetric(key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title={`Pagadores ${TIPO_LABEL[tipo]}`}
      subtitle="Série mensal do município selecionado"
      tabs={tabs}
    >
      {rows.length === 0 ? (
        <p className="state-message">Sem dados para este município.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`municipioFill-${tipo}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={cfg.compact}
            />
            <Tooltip
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
              content={<ChartTooltip formatValue={cfg.full} />}
            />
            <Area
              type="monotone"
              dataKey="valor"
              name={cfg.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#municipioFill-${tipo})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
