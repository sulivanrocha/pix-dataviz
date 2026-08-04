// src/App.jsx
// Rotas, cabeçalho e rodapé. O estado de aba vive na URL (react-router),
// não em useState — é isso que dá ao Google cinco páginas indexáveis.
// O idioma é um toggle de UI (não muda a URL); todo texto passa por t().

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { usePixData } from "./lib/usePixData";
import { TabNav } from "./components/shared/TabNav";
import { LanguageToggle } from "./components/shared/LanguageToggle";
import { tabFromPath } from "./lib/tabs";
import { useDocumentMeta } from "./lib/useDocumentMeta";
import { useI18n } from "./lib/i18n/I18nContext";
import { OverviewPage } from "./pages/OverviewPage";
import { UsuariosDictPage } from "./pages/UsuariosDictPage";
import { ChavesPixPage } from "./pages/ChavesPixPage";
import { TransacoesMunicipioPage } from "./pages/TransacoesMunicipioPage";
import { EstatisticasTransacoesPage } from "./pages/EstatisticasTransacoesPage";

function App() {
  const { status, data, error } = usePixData();
  const location = useLocation();
  const { lang, t } = useI18n();
  const tab = tabFromPath(location.pathname);

  // Precisa ficar acima dos early returns: hooks não podem vir depois de
  // um return condicional. Depende de tab e lang, ambos seguros aqui.
  useDocumentMeta(tab, lang);

  if (status === "loading") {
    return <p className="state-message">{t("state.loading")}</p>;
  }

  if (status === "error") {
    return (
      <p className="state-message">
        {t("state.error", { command: "" })}
        <code>node scripts/fetch-data.mjs</code>
        <br />
        {String(error)}
      </p>
    );
  }

  const { transacoes, usuariosDict, municipio, chaves } = data;

  const snapshotDate = new Date(transacoes.generatedAt).toLocaleDateString(
    lang === "en" ? "en-US" : "pt-BR"
  );

  return (
    <>
      <header className="app-header">
        <div className="app-header__lang">
          <LanguageToggle />
        </div>

        <div className="app-header__title">
          <h1>{t("header.title")}</h1>
        </div>

        <p className="app-header__subtitle">
          {t("header.subtitle", { date: snapshotDate })}
        </p>

        <div className="app-header__meta">
          <span className="app-header__author">
            {t("header.author")}{" "}
            <a href="https://www.linkedin.com/in/sulivanrocha/" target="_blank" rel="noreferrer">
              Sulivan Rocha
            </a>
          </span>
          <span className="app-header__disclaimer">
            {t("header.disclaimer")}
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
        {t("footer.source")}{" "}
        <a
          href="https://dadosabertos.bcb.gov.br/dataset/pix"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.sourceName")}
        </a>
        . {t("footer.code")}{" "}
        <a
          href="https://github.com/sulivanrocha/pix-dataviz"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.github")}
        </a>
        .
      </footer>
    </>
  );
}

export default App;
