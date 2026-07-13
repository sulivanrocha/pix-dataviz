import { useMemo, useState } from "react";
import { StatTile } from "../components/StatTile";
import { ChavesPorParticipante } from "../components/ChavesPorParticipante";
import { formatNumberCompact } from "../lib/format";

const TOPN_OPTIONS = [5, 10, 20, 50];

export function ChavesPixPage({ chaves }) {
  const [tipo, setTipo] = useState("total");
  const [topN, setTopN] = useState(10);

  const totals = useMemo(
    () =>
      chaves.porParticipante.reduce(
        (acc, p) => {
          acc.PF += p.PF;
          acc.PJ += p.PJ;
          acc.total += p.total;
          return acc;
        },
        { PF: 0, PJ: 0, total: 0 }
      ),
    [chaves.porParticipante]
  );

  return (
    <>
      <section className="kpi-row">
        <StatTile label="Total de chaves Pix cadastradas" value={formatNumberCompact(totals.total)} />
        <StatTile label="Chaves de pessoa física" value={formatNumberCompact(totals.PF)} />
        <StatTile label="Chaves de pessoa jurídica" value={formatNumberCompact(totals.PJ)} />
      </section>

      <div className="filters-row">
        <label>
          Tipo de usuário
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="total">Física e jurídica</option>
            <option value="PF">Pessoa física</option>
            <option value="PJ">Pessoa jurídica</option>
          </select>
        </label>
        <label>
          Top N participantes
          <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
            {TOPN_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="filters-hint">Estoque de chaves Pix por instituição participante.</span>
      </div>

      <section className="charts-grid">
        <ChavesPorParticipante data={chaves.data} porParticipante={chaves.porParticipante} tipo={tipo} topN={topN} />
      </section>
    </>
  );
}
