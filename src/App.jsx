import { useState } from "react";
import { usePixData } from "./lib/usePixData";
import { TabNav } from "./components/shared/TabNav";
import { TABS } from "./lib/tabs";
import { OverviewPage } from "./pages/OverviewPage";
import { UsuariosDictPage } from "./pages/UsuariosDictPage";
import { ChavesPixPage } from "./pages/ChavesPixPage";
import { TransacoesMunicipioPage } from "./pages/TransacoesMunicipioPage";
import { EstatisticasTransacoesPage } from "./pages/EstatisticasTransacoesPage";

function App() {
  const { status, data, error } = usePixData();
  const [tab, setTab] = useState(TABS[0].key);

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

  return (
    <>
      <header className="app-header">
        <div className="app-header__title">
          <h1>Dashboard Pix</h1>
        </div>

        <p className="app-header__subtitle">
          Visualizações interativas do Pix a partir dos dados abertos do Banco Central do Brasil. Snapshot
          gerado em {new Date(transacoes.generatedAt).toLocaleDateString("pt-BR")}.
        </p>

        <div className="app-header__meta">
          <span className="app-header__author">
            Projeto independente por{" "}
            <a href="https://github.com/sulivanrocha" target="_blank" rel="noreferrer">
              Sulivan Rocha
            </a>
          </span>
          <span className="app-header__disclaimer">
            Não é um serviço oficial do Banco Central. Apenas os dados são de fonte oficial.
          </span>
        </div>
      </header>

      <TabNav active={tab} onChange={setTab} />

      {tab === "overview" && <OverviewPage />}
      {tab === "dict" && <UsuariosDictPage usuariosDict={usuariosDict.dados} />}
      {tab === "chaves" && <ChavesPixPage chaves={chaves} />}
      {tab === "municipio" && <TransacoesMunicipioPage municipio={municipio} />}
      {tab === "transacoes" && <EstatisticasTransacoesPage transacoes={transacoes} />}

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