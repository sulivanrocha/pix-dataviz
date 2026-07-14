import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull } from "../../../lib/format";

const PERSPECTIVAS = [
  { value: "Pagador", label: "Pagador" },
  { value: "Recebedor", label: "Recebedor" },
];

function valorField(perspectiva, seg) {
  return `VL_${perspectiva}${seg}`;
}

function quantidadeField(perspectiva, seg) {
  return `QT_${perspectiva}${seg}`;
}

// Sempre visível: soma valor/quantidade PF+PJ por mês, a partir de
// porEstadoMensal (cubo já carregado na página). Sem filtro de estado
// selecionado, soma o Brasil inteiro; com um estadoIbge, restringe a ele;
// com apenas uma regiao (sem estado ainda), restringe à região.
export function RegiaoSummaryChart({ porEstadoMensal, regiao, estadoIbge }) {
  const [perspectiva, setPerspectiva] = useState("Pagador");

  const estadoNome = useMemo(() => {
    if (!estadoIbge) return null;
    const match = porEstadoMensal.find((r) => r.Estado_Ibge === estadoIbge);
    return match ? match.Estado : null;
  }, [porEstadoMensal, estadoIbge]);

  const rows = useMemo(() => {
    const filtered = porEstadoMensal.filter((r) => {
      if (estadoIbge) return r.Estado_Ibge === estadoIbge;
      if (regiao) return r.Regiao === regiao;
      return true;
    });

    const byMonth = new Map();
    for (const r of filtered) {
      const valor =
        (Number(r[valorField(perspectiva, "PF")]) || 0) +
        (Number(r[valorField(perspectiva, "PJ")]) || 0);
      const quantidade =
        (Number(r[quantidadeField(perspectiva, "PF")]) || 0) +
        (Number(r[quantidadeField(perspectiva, "PJ")]) || 0);

      const prev = byMonth.get(r.AnoMes) ?? { valor: 0, quantidade: 0 };
      byMonth.set(r.AnoMes, { valor: prev.valor + valor, quantidade: prev.quantidade + quantidade });
    }

    return [...byMonth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([anoMes, totals]) => ({
        mes: formatAnoMes(anoMes),
        ...totals,
      }));
  }, [porEstadoMensal, regiao, estadoIbge, perspectiva]);

  const scopeLabel = estadoNome ?? (regiao && regiao !== "Todas" ? regiao : "Brasil (todos os estados)");
  const perspectivaLabel = perspectiva === "Pagador" ? "pago" : "recebido";

  const tabs = (
    <div className="chart-tabs">
      {PERSPECTIVAS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={p.value === perspectiva ? "active" : ""}
          onClick={() => setPerspectiva(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title={`Total ${perspectivaLabel} — ${scopeLabel}`}
      subtitle="Soma mensal (PF + PJ); ajusta conforme região/estado selecionados acima"
      fullWidth
      tabs={tabs}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={formatCurrencyCompact}
          />
          <Tooltip
            cursor={{ fill: "var(--gridline)", opacity: 0.35 }}
            content={<ChartTooltip formatValue={formatCurrencyFull} />}
          />
          <Bar dataKey="valor" name="Valor" fill="var(--series-1)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}