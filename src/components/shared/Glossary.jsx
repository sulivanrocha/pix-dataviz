// src/components/shared/Glossary.jsx
// Seção de glossário reutilizável, renderizada ao fim de cada página de
// conteúdo. Recebe uma lista de { term, description } já no idioma ativo
// (as definições vivem em src/lib/i18n/glossary.js) e reaproveita os estilos
// existentes (.definitions-section) — sem estilo novo.

import { useI18n } from "../../lib/i18n/I18nContext";

export function Glossary({ items }) {
  const { t } = useI18n();

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="definitions-section">
      <span className="definitions-eyebrow">{t("glossaryUi.eyebrow")}</span>
      <h3>{t("glossaryUi.heading")}</h3>
      <dl>
        {items.map(({ term, description }) => (
          <div key={term} className="definitions-item">
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
