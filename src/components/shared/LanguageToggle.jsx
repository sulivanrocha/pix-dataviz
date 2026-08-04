// src/components/shared/LanguageToggle.jsx
// Alternador PT-BR / EN-US. Segmented control de dois botões: o idioma ativo
// fica destacado. Vive no canto superior direito do cabeçalho.

import { useI18n } from "../../lib/i18n/I18nContext";

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label={t("langToggle.label")}>
      <button
        type="button"
        className={`lang-toggle__btn${lang === "pt" ? " is-active" : ""}`}
        aria-pressed={lang === "pt"}
        aria-label={t("langToggle.toPt")}
        onClick={() => setLang("pt")}
      >
        {t("langToggle.pt")}
      </button>
      <button
        type="button"
        className={`lang-toggle__btn${lang === "en" ? " is-active" : ""}`}
        aria-pressed={lang === "en"}
        aria-label={t("langToggle.toEn")}
        onClick={() => setLang("en")}
      >
        {t("langToggle.en")}
      </button>

      <style>
        {`
          .lang-toggle {
            display: inline-flex;
            align-items: center;
            gap: 0;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            background: var(--surface-1);
          }
          .lang-toggle__btn {
            appearance: none;
            border: 0;
            background: transparent;
            color: var(--text-secondary);
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.03em;
            padding: 6px 12px;
            min-height: 32px;
            cursor: pointer;
            transition: background-color 150ms ease, color 150ms ease;
          }
          .lang-toggle__btn + .lang-toggle__btn {
            border-left: 1px solid var(--border);
          }
          .lang-toggle__btn:hover:not(.is-active) {
            background: var(--gridline);
            color: var(--text-primary);
          }
          .lang-toggle__btn.is-active {
            background: var(--accent);
            color: var(--accent-contrast, #fff);
          }
          .lang-toggle__btn:focus-visible {
            outline: 2px solid var(--series-1);
            outline-offset: -2px;
          }
        `}
      </style>
    </div>
  );
}
