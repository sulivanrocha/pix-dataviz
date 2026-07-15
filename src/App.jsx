// src/App.jsx
// Rotas, cabeçalho e rodapé. O estado de aba agora vive na URL (react-router),
// não em useState — é isso que dá ao Google cinco páginas indexáveis em vez de uma.

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { usePixData } from "./lib/usePixData";
import { TabNav } from "./components/shared/TabNav";
import { tabFromPath } from "./lib/tabs";
import { useDocumentMeta } from "./lib/useDocumentMeta";
import { OverviewPage } from "./pages/OverviewPage";
import { UsuariosDictPage } from "./pages/UsuariosDictPage";
import { ChavesPixPage } from "./pages/ChavesPixPage";
import { TransacoesMunicipioPage } from "./pages/TransacoesMunicipioPage";
import { EstatisticasTransacoesPage } from "./pages/EstatisticasTransacoesPage";

function App() {
  const { status, data, error } = usePixData();
  const location = useLocation();
  const tab = tabFromPath(location.pathname);

  // Precisa ficar acima dos early returns: hooks não podem vir depois de
  // um return condicional. tabFromPath só depende da URL, então é seguro.
  useDocumentMeta(tab);

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
          <h1>Dados do Pix</h1>
        </div>

        <p className="app-header__subtitle">
          Visualizações interativas do Pix a partir dos dados abertos do Banco Central do Brasil. Snapshot
          gerado em {new Date(transacoes.generatedAt).toLocaleDateString("pt-BR")}.
        </p>

        <div className="app-header__meta">
          <span className="app-header__author">
            Projeto independente por{" "}
            <a href="https://www.linkedin.com/in/sulivanrocha/" target="_blank" rel="noreferrer">
              Sulivan Rocha
            </a>
          </span>
          <span className="app-header__disclaimer">
            Não é um serviço oficial do Banco Central.
          </span>
        </div>
      </header>

      <TabNav />

      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/usuarios" element={<UsuariosDictPage usuariosDict={usuariosDict.dados} />} />
        <Route path="/chaves" element={<ChavesPixPage chaves={chaves} />} />
        <Route path="/municipios" element={<TransacoesMunicipioPage municipio={municipio} />} />
        <Route path="/transacoes" element={<EstatisticasTransacoesPage transacoes={transacoes} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="app-footer">
        Fonte: API pública de{" "}
        <a
          href="https://dadosabertos.bcb.gov.br/dataset/pix"
          target="_blank"
          rel="noreferrer"
        >
          Dados Abertos do Banco Central do Brasil
        </a>
        . Código-fonte disponível no{" "}
        <a
          href="https://github.com/sulivanrocha/pix-dataviz"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </footer>
    </>
  );
}

export default App;