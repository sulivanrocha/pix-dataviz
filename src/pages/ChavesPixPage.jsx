import { useMemo, useState } from "react";
import { StatTile } from "../components/shared/StatTile";
import { ChavesPorParticipante } from "../components/charts/chaves/ChavesPorParticipante";
import { formatNumberCompact } from "../lib/format";

const TOPN_OPTIONS = [5, 10, 20, 50];

export function ChavesPixPage({ chaves }) {
  const [topN, setTopN] = useState(10);

  const totals = useMemo(
    () =>
      chaves.porParticipante.reduce(
        (acc, participante) => {
          acc.PF += participante.PF;
          acc.PJ += participante.PJ;
          acc.total += participante.total;
          return acc;
        },
        {
          PF: 0,
          PJ: 0,
          total: 0,
        }
      ),
    [chaves.porParticipante]
  );

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label="Total de chaves Pix cadastradas"
          value={formatNumberCompact(totals.total)}
        />

        <StatTile
          label="Chaves de pessoa física"
          value={formatNumberCompact(totals.PF)}
        />

        <StatTile
          label="Chaves de pessoa jurídica"
          value={formatNumberCompact(totals.PJ)}
        />
      </section>

      <div className="filters-row">
        <label>
          Top N participantes

          <select
            value={topN}
            onChange={(event) => setTopN(Number(event.target.value))}
          >
            {TOPN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <span className="filters-hint">
          Estoque de chaves Pix por instituição participante, com rankings separados para PF e PJ.
        </span>
      </div>

      <section className="charts-grid">
        <ChavesPorParticipante
          data={chaves.data}
          porParticipante={chaves.porParticipante}
          topN={topN}
        />
      </section>
    </>
  );
}