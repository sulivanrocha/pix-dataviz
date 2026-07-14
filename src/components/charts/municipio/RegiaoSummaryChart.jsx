import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull } from "../../../lib/format";

const SEGMENTO_LABEL = {
  Todos: "PF + PJ",
  PF: "pessoa física",
  PJ: "pessoa jurídica",
};

function valorField(perspectiva, seg) {
  return `VL_${perspectiva}${seg}`;
}

function quantidadeField(perspectiva, seg) {
  return `QT_${perspectiva}${seg}`;
}

function sumBySegmento(row, perspectiva, segmento, fieldFn) {
  if (segmento === "Todos") {
    return (
      (Number(row[fieldFn(perspectiva, "PF")]) || 0) +
      (Number(row[fieldFn(perspectiva, "PJ")]) || 0)
    );
  }

  return Number(row[fieldFn(perspectiva, segmento)]) || 0;
}

export function RegiaoSummaryChart({
  porEstadoMensal,
  regiao,
  estadoIbge,
  municipio,
  serieMunicipio,
  perspectiva,
  segmento = "Todos",
  ultimoMesCompleto,
}) {
  const nivelMunicipio = Boolean(municipio && serieMunicipio?.length);

  const estadoNome = useMemo(() => {
    if (!estadoIbge) return null;
    const match = porEstadoMensal.find((r) => r.Estado_Ibge === estadoIbge);
    return match ? match.Estado : null;
  }, [porEstadoMensal, estadoIbge]);

  const rows = useMemo(() => {
    if (nivelMunicipio) {
      return [...serieMunicipio]
        .filter((r) => r.AnoMes <= ultimoMesCompleto)
        .sort((a, b) => a.AnoMes - b.AnoMes)
        .map((r) => ({
          mes: formatAnoMes(r.AnoMes),
          valor: sumBySegmento(r, perspectiva, segmento, valorField),
          quantidade: sumBySegmento(r, perspectiva, segmento, quantidadeField),
        }));
    }

    const filtered = porEstadoMensal.filter((r) => {
      if (r.AnoMes > ultimoMesCompleto) return false;
      if (estadoIbge) return r.Estado_Ibge === estadoIbge;
      if (regiao && regiao !== "Todas") return r.Regiao === regiao;
      return true;
    });

    const byMonth = new Map();
    for (const r of filtered) {
      const valor = sumBySegmento(r, perspectiva, segmento, valorField);
      const quantidade = sumBySegmento(r, perspectiva, segmento, quantidadeField);

      const prev = byMonth.get(r.AnoMes) ?? { valor: 0, quantidade: 0 };
      byMonth.set(r.AnoMes, {
        valor: prev.valor + valor,
        quantidade: prev.quantidade + quantidade,
      });
    }

    return [...byMonth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([anoMes, totals]) => ({
        mes: formatAnoMes(anoMes),
        ...totals,
      }));
  }, [
    porEstadoMensal,
    regiao,
    estadoIbge,
    perspectiva,
    segmento,
    nivelMunicipio,
    serieMunicipio,
    ultimoMesCompleto,
  ]);

  const scopeParts = [];
  if (regiao && regiao !== "Todas") scopeParts.push(regiao);
  if (estadoNome) scopeParts.push(estadoNome);
  if (nivelMunicipio) scopeParts.push(`${municipio.nome}, ${municipio.uf}`);
  const scopeLabel = scopeParts.length > 0
    ? scopeParts.join(" › ")
    : "Brasil (todos os estados)";

  const perspectivaLabel = perspectiva === "Pagador" ? "pago" : "recebido";

  return (
    <ChartCard
      title={`Total ${perspectivaLabel}: ${scopeLabel}`}
      subtitle={`Soma mensal de ${SEGMENTO_LABEL[segmento]}, atualizada conforme os filtros desta seção.`}
      fullWidth
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