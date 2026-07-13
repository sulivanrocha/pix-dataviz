import { useMemo, useState } from "react";
import { usePixData } from "./lib/usePixData";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull, formatNumberCompact } from "./lib/format";
import { Filters } from "./components/Filters";
import { StatTile } from "./components/StatTile";
import { TrendChart } from "./components/TrendChart";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { UsersGrowthChart } from "./components/UsersGrowthChart";
import { StateRanking } from "./components/StateRanking";
import { ChavesPorParticipante } from "./components/ChavesPorParticipante";

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function App() {
  const { status, data, error } = usePixData();
  const months = useMemo(
    () => (data ? [...new Set(data.transacoes.mensal.map((r) => r.AnoMes))].sort() : []),
    [data]
  );
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const range = {
    start: start ?? months[0],
    end: end ?? months[months.length - 1],
  };

  if (status === "loading") {
    return <p className="state-message">Carregando dados do Pix...</p>;
  }

  if (status === "error") {
    return (
      <p className="state-message">
        Não foi possível carregar os dados locais. Rode <code>node scripts/fetch-data.mjs</code> e recarregue a
        página.
        <br />
        {String(error)}
      </p>
    );
  }

  const { transacoes, usuariosDict, municipio, chaves } = data;
  const mensal = transacoes.mensal;
  const latest = mensal[mensal.length - 1];
  const previous = mensal[mensal.length - 2];
  const dictLatest = usuariosDict.dados[usuariosDict.dados.length - 1];
  const dictPrevious = usuariosDict.dados[usuariosDict.dados.length - 2];

  return (
    <>
      <header className="app-header">
        <h1>Dashboard Pix</h1>
        <p>
          Estatísticas oficiais do Pix — dados abertos do Banco Central do Brasil. Snapshot gerado em{" "}
          {new Date(transacoes.generatedAt).toLocaleDateString("pt-BR")}.
        </p>
      </header>

      <Filters months={months} start={range.start} end={range.end} onStartChange={setStart} onEndChange={setEnd} />

      <section className="kpi-row">
        <StatTile
          label={`Valor transacionado (${formatAnoMes(latest.AnoMes)})`}
          value={formatCurrencyCompact(latest.VALOR)}
          delta={pctDelta(latest.VALOR, previous?.VALOR)}
        />
        <StatTile
          label={`Transações liquidadas (${formatAnoMes(latest.AnoMes)})`}
          value={formatNumberCompact(latest.QUANTIDADE)}
          delta={pctDelta(latest.QUANTIDADE, previous?.QUANTIDADE)}
        />
        <StatTile
          label="Ticket médio"
          value={formatCurrencyFull(latest.VALOR / latest.QUANTIDADE)}
        />
        <StatTile
          label="Usuários cadastrados no DICT"
          value={formatNumberCompact(dictLatest.total)}
          delta={pctDelta(dictLatest.total, dictPrevious?.total)}
        />
      </section>

      <section className="charts-grid">
        <TrendChart mensal={mensal} start={range.start} end={range.end} />
        <CategoryBreakdown transacoes={transacoes} start={range.start} end={range.end} />
        <UsersGrowthChart usuariosDict={usuariosDict.dados} />
        <StateRanking porEstadoMensal={municipio.porEstadoMensal} start={range.start} end={range.end} />
        <ChavesPorParticipante data={chaves.data} porParticipante={chaves.porParticipante} />
      </section>

      <footer className="app-footer">
        Fonte: API pública de{" "}
        <a href="https://dadosabertos.bcb.gov.br/dataset/pix" target="_blank" rel="noreferrer">
          Dados Abertos do Banco Central do Brasil
        </a>
        . Dados servidos como snapshot estático — reexecute <code>node scripts/fetch-data.mjs</code> para atualizar.
      </footer>
    </>
  );
}

export default App;
