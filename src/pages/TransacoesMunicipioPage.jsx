import { useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import { StatTile } from "../components/StatTile";
import { StateRanking } from "../components/StateRanking";
import { formatCurrencyCompact, formatCurrencyFull, formatNumberCompact } from "../lib/format";

const REGIOES = [
  { value: "Todas", label: "Todas as regiões" },
  { value: "SUDESTE", label: "Sudeste" },
  { value: "NORDESTE", label: "Nordeste" },
  { value: "SUL", label: "Sul" },
  { value: "NORTE", label: "Norte" },
  { value: "CENTRO-OESTE", label: "Centro-Oeste" },
];

export function TransacoesMunicipioPage({ municipio }) {
  const months = useMemo(
    () => [...new Set(municipio.porEstadoMensal.map((r) => r.AnoMes))].sort(),
    [municipio]
  );
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [regiao, setRegiao] = useState("Todas");
  const range = { start: start ?? months[0], end: end ?? months[months.length - 1] };

  const totals = useMemo(() => {
    const filtered = municipio.porEstadoMensal.filter(
      (r) => r.AnoMes >= range.start && r.AnoMes <= range.end && (regiao === "Todas" || r.Regiao === regiao)
    );
    return filtered.reduce(
      (acc, r) => {
        acc.valor += r.VL_PagadorPF + r.VL_PagadorPJ;
        acc.quantidade += r.QT_PagadorPF + r.QT_PagadorPJ;
        return acc;
      },
      { valor: 0, quantidade: 0 }
    );
  }, [municipio, range.start, range.end, regiao]);

  return (
    <>
      <section className="kpi-row">
        <StatTile label="Valor pago no período" value={formatCurrencyCompact(totals.valor)} />
        <StatTile label="Transações pagas no período" value={formatNumberCompact(totals.quantidade)} />
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
      </Filters>

      <section className="charts-grid">
        <StateRanking porEstadoMensal={municipio.porEstadoMensal} start={range.start} end={range.end} regiao={regiao} />
      </section>
    </>
  );
}
