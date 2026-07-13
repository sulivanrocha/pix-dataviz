import { useMemo, useState } from "react";
import { StatTile } from "../components/shared/StatTile";
import { ChavesHistorico } from "../components/charts/chaves/ChavesHistorico";
import { ChavesPorParticipante } from "../components/charts/chaves/ChavesPorParticipante";
import {
  formatAnoMes,
  formatNumberCompact,
} from "../lib/format";

const TOPN_OPTIONS = [5, 10, 15, 20, 25];

function getTimestamp(date) {
  if (!date) return 0;

  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? 0
    : parsed.getTime();
}

export function ChavesPixPage({ chaves }) {
  const [topN, setTopN] = useState(5);

  const historicalData = useMemo(
    () =>
      chaves.historico ??
      chaves.serieHistorica ??
      chaves.porData ??
      [],
    [chaves]
  );

  const sortedHistory = useMemo(
    () =>
      [...historicalData].sort(
        (a, b) => getTimestamp(a.data) - getTimestamp(b.data)
      ),
    [historicalData]
  );

  const latestRecord = useMemo(() => {
    if (sortedHistory.length > 0) {
      return sortedHistory.at(-1);
    }

    const totals = chaves.porParticipante.reduce(
      (acc, participante) => {
        acc.PF += Number(participante.PF) || 0;
        acc.PJ += Number(participante.PJ) || 0;
        acc.total += Number(participante.total) || 0;

        return acc;
      },
      {
        PF: 0,
        PJ: 0,
        total: 0,
      }
    );

    return {
      data: chaves.data,
      ...totals,
    };
  }, [
    sortedHistory,
    chaves.data,
    chaves.porParticipante,
  ]);

  const referenceMonth = useMemo(() => {
    if (!latestRecord?.data) {
      return "último mês disponível";
    }

    const numericMonth = Number(
      latestRecord.data
        .slice(0, 7)
        .replace("-", "")
    );

    return formatAnoMes(numericMonth);
  }, [latestRecord]);

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label={`Total de chaves Pix · ${referenceMonth}`}
          value={formatNumberCompact(
            Number(latestRecord?.total) || 0
          )}
        />

        <StatTile
          label={`Chaves de pessoa física · ${referenceMonth}`}
          value={formatNumberCompact(
            Number(latestRecord?.PF) || 0
          )}
        />

        <StatTile
          label={`Chaves de pessoa jurídica · ${referenceMonth}`}
          value={formatNumberCompact(
            Number(latestRecord?.PJ) || 0
          )}
        />
      </section>

      {sortedHistory.length > 0 && (
        <section className="charts-grid">
          <ChavesHistorico
            historico={sortedHistory}
          />
        </section>
      )}

      <div className="filters-row">
        <label>
          Top N participantes

          <select
            value={topN}
            onChange={(event) =>
              setTopN(Number(event.target.value))
            }
          >
            {TOPN_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </label>

        <span className="filters-hint">
          Estoque no último mês disponível, com rankings separados para PF e PJ.
        </span>
      </div>

      <section className="charts-grid">
        <ChavesPorParticipante
          data={latestRecord?.data ?? chaves.data}
          porParticipante={chaves.porParticipante}
          topN={topN}
        />
      </section>
    </>
  );
}