import { useMemo, useState } from "react";
import { Filters } from "../components/shared/Filters";
import { StatTile } from "../components/shared/StatTile";
import { StateRanking } from "../components/charts/municipio/StateRanking";
import { RegiaoSummaryChart } from "../components/charts/municipio/RegiaoSummaryChart";
import { MunicipioSelector } from "../components/MunicipioSelector";
import { MunicipioPFPJChart } from "../components/MunicipioPFPJChart";
import { formatCurrencyCompact, formatCurrencyFull, formatNumberCompact } from "../lib/format";

const REGIOES = [
  { value: "Todas", label: "Todas as regiões" },
  { value: "SUDESTE", label: "Sudeste" },
  { value: "NORDESTE", label: "Nordeste" },
  { value: "SUL", label: "Sul" },
  { value: "NORTE", label: "Norte" },
  { value: "CENTRO-OESTE", label: "Centro-Oeste" },
];

const PERSPECTIVAS = [
  { value: "Pagador", label: "Pagador" },
  { value: "Recebedor", label: "Recebedor" },
];

const SEGMENTOS = [
  { value: "Todos", label: "Todos (PF + PJ)" },
  { value: "PF", label: "Pessoa física (PF)" },
  { value: "PJ", label: "Pessoa jurídica (PJ)" },
];

function valorFields(perspectiva, segmento) {
  if (segmento === "Todos") return [`VL_${perspectiva}PF`, `VL_${perspectiva}PJ`];
  return [`VL_${perspectiva}${segmento}`];
}

function quantidadeFields(perspectiva, segmento) {
  if (segmento === "Todos") return [`QT_${perspectiva}PF`, `QT_${perspectiva}PJ`];
  return [`QT_${perspectiva}${segmento}`];
}

export function TransacoesMunicipioPage({ municipio }) {
  const months = useMemo(
    () => [...new Set(municipio.porEstadoMensal.map((r) => r.AnoMes))].sort(),
    [municipio]
  );
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [regiao, setRegiao] = useState("Todas");
  const [perspectiva, setPerspectiva] = useState("Pagador");
  const [segmento, setSegmento] = useState("Todos");
  const range = { start: start ?? months[0], end: end ?? months[months.length - 1] };

  const [selecaoMunicipio, setSelecaoMunicipio] = useState({
    regiao: null,
    estadoIbge: null,
    municipio: null,
    dadosEstado: [],
  });

  const serieMunicipio = useMemo(() => {
    if (!selecaoMunicipio.municipio) return [];
    return selecaoMunicipio.dadosEstado.filter((r) => r.Municipio_Ibge === selecaoMunicipio.municipio.ibge);
  }, [selecaoMunicipio]);

  const totals = useMemo(() => {
    const vFields = valorFields(perspectiva, segmento);
    const qFields = quantidadeFields(perspectiva, segmento);

    const filtered = municipio.porEstadoMensal.filter(
      (r) => r.AnoMes >= range.start && r.AnoMes <= range.end && (regiao === "Todas" || r.Regiao === regiao)
    );

    return filtered.reduce(
      (acc, r) => {
        acc.valor += vFields.reduce((sum, field) => sum + (Number(r[field]) || 0), 0);
        acc.quantidade += qFields.reduce((sum, field) => sum + (Number(r[field]) || 0), 0);
        return acc;
      },
      { valor: 0, quantidade: 0 }
    );
  }, [municipio, range.start, range.end, regiao, perspectiva, segmento]);

  const perspectivaLabel = perspectiva === "Pagador" ? "pago" : "recebido";

  return (
    <>
      <section className="kpi-row">
        <StatTile label={`Valor ${perspectivaLabel} no período`} value={formatCurrencyCompact(totals.valor)} />
        <StatTile label={`Transações (${perspectivaLabel}s) no período`} value={formatNumberCompact(totals.quantidade)} />
        <StatTile label="Ticket médio" value={formatCurrencyFull(totals.valor / totals.quantidade)} />
      </section>

      <Filters
        months={months}
        start={range.start}
        end={range.end}
        onStartChange={setStart}
        onEndChange={setEnd}
        hint="Filtra o ranking de estados abaixo."
      >
        <label>
          Região
          <select value={regiao} onChange={(e) => setRegiao(e.target.value)}>
            {REGIOES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Perspectiva
          <select value={perspectiva} onChange={(e) => setPerspectiva(e.target.value)}>
            {PERSPECTIVAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Segmento
          <select value={segmento} onChange={(e) => setSegmento(e.target.value)}>
            {SEGMENTOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </Filters>

      <section className="charts-grid">
        <StateRanking
          porEstadoMensal={municipio.porEstadoMensal}
          start={range.start}
          end={range.end}
          regiao={regiao}
          perspectiva={perspectiva}
          segmento={segmento}
        />
      </section>

      <MunicipioSelector
        onChange={(s) =>
          setSelecaoMunicipio({
            regiao: s.regiao || null,
            estadoIbge: s.estadoIbge || null,
            municipio: s.municipio,
            dadosEstado: s.dadosEstado,
          })
        }
      />

      <section className="charts-grid">
        <RegiaoSummaryChart
          porEstadoMensal={municipio.porEstadoMensal}
          regiao={selecaoMunicipio.regiao}
          estadoIbge={selecaoMunicipio.estadoIbge}
        />
      </section>

      {selecaoMunicipio.municipio && (
        <section className="charts-grid">
          <MunicipioPFPJChart serieMensal={serieMunicipio} tipo="PF" />
          <MunicipioPFPJChart serieMensal={serieMunicipio} tipo="PJ" />
        </section>
      )}
    </>
  );
}