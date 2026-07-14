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

// Sempre visível: soma valor/quantidade PF+PJ por mês. Desce até o nível
// mais profundo selecionado acima: Brasil inteiro (nada selecionado),
// região, estado (via porEstadoMensal) ou município (via serieMunicipio,
// carregada pela página). O título mostra o caminho completo da seleção.
//
// Atenção: o cubo municipal (municipios/*.json) só traz a perspectiva do
// PAGADOR — o dado do BC não tem Recebedor por município. Por isso, com um
// município selecionado, a perspectiva é forçada para Pagador e a aba
// Recebedor fica desabilitada.
export function RegiaoSummaryChart({ porEstadoMensal, regiao, estadoIbge, municipio, serieMunicipio }) {
  const [perspectiva, setPerspectiva] = useState("Pagador");

  const nivelMunicipio = Boolean(municipio && serieMunicipio?.length);
  const perspectivaEfetiva = nivelMunicipio ? "Pagador" : perspectiva;

  const estadoNome = useMemo(() => {
    if (!estadoIbge) return null;
    const match = porEstadoMensal.find((r) => r.Estado_Ibge === estadoIbge);
    return match ? match.Estado : null;
  }, [porEstadoMensal, estadoIbge]);

  const rows = useMemo(() => {
    // Nível município: usa a série mensal já filtrada para um único
    // Municipio_Ibge pela página. Só existem campos de Pagador.
    if (nivelMunicipio) {
      return [...serieMunicipio]
        .sort((a, b) => a.AnoMes - b.AnoMes)
        .map((r) => ({
          mes: formatAnoMes(r.AnoMes),
          valor: (Number(r.VL_PagadorPF) || 0) + (Number(r.VL_PagadorPJ) || 0),
          quantidade: (Number(r.QT_PagadorPF) || 0) + (Number(r.QT_PagadorPJ) || 0),
        }));
    }

    // Níveis Brasil / região / estado: agrega o cubo por estado.
    const filtered = porEstadoMensal.filter((r) => {
      if (estadoIbge) return r.Estado_Ibge === estadoIbge;
      if (regiao) return r.Regiao === regiao;
      return true;
    });

    const byMonth = new Map();
    for (const r of filtered) {
      const valor =
        (Number(r[valorField(perspectivaEfetiva, "PF")]) || 0) +
        (Number(r[valorField(perspectivaEfetiva, "PJ")]) || 0);
      const quantidade =
        (Number(r[quantidadeField(perspectivaEfetiva, "PF")]) || 0) +
        (Number(r[quantidadeField(perspectivaEfetiva, "PJ")]) || 0);

      const prev = byMonth.get(r.AnoMes) ?? { valor: 0, quantidade: 0 };
      byMonth.set(r.AnoMes, { valor: prev.valor + valor, quantidade: prev.quantidade + quantidade });
    }

    return [...byMonth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([anoMes, totals]) => ({
        mes: formatAnoMes(anoMes),
        ...totals,
      }));
  }, [porEstadoMensal, regiao, estadoIbge, perspectivaEfetiva, nivelMunicipio, serieMunicipio]);

  // Caminho completo da seleção: Região › Estado › Município, com fallback
  // para o Brasil inteiro quando nada está selecionado.
  const scopeParts = [];
  if (regiao && regiao !== "Todas") scopeParts.push(regiao);
  if (estadoNome) scopeParts.push(estadoNome);
  if (nivelMunicipio) scopeParts.push(`${municipio.nome}, ${municipio.uf}`);
  const scopeLabel = scopeParts.length > 0 ? scopeParts.join(" › ") : "Brasil (todos os estados)";

  const perspectivaLabel = perspectivaEfetiva === "Pagador" ? "pago" : "recebido";

  const subtitle = nivelMunicipio
    ? "Soma mensal (PF + PJ), perspectiva pagador — o dado municipal do BC não traz a visão do recebedor"
    : "Soma mensal (PF + PJ); ajusta conforme região, estado e município selecionados acima";

  const tabs = (
    <div className="chart-tabs">
      {PERSPECTIVAS.map((p) => {
        const desabilitado = nivelMunicipio && p.value === "Recebedor";
        return (
          <button
            key={p.value}
            type="button"
            className={p.value === perspectivaEfetiva ? "active" : ""}
            disabled={desabilitado}
            title={desabilitado ? "Indisponível no nível de município" : undefined}
            onClick={() => setPerspectiva(p.value)}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <ChartCard
      title={`Total ${perspectivaLabel} — ${scopeLabel}`}
      subtitle={subtitle}
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