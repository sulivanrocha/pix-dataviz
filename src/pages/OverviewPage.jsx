import { useI18n } from "../lib/i18n/I18nContext";
import { TABS } from "../lib/tabs";

// A ordem dos cards segue as abas de conteúdo (todas menos a Visão geral).
// Cada card puxa pergunta/descrição de messages.overview.resources[key].
const RESOURCE_KEYS = ["dict", "chaves", "municipio", "transacoes"];

export function OverviewPage() {
  const { t } = useI18n();

  const cards = RESOURCE_KEYS.map((key) => {
    const tab = TABS.find((tabItem) => tabItem.key === key);
    return {
      key,
      badge: t(tab.labelKey),
      question: t(`overview.resources.${key}.question`),
      description: t(`overview.resources.${key}.description`),
    };
  });

  return (
    <>
      <section className="overview-intro">
        <span className="overview-intro__eyebrow">{t("overview.eyebrow")}</span>
        <h2>{t("overview.heading")}</h2>
        <p>{t("overview.intro1")}</p>
        <p>{t("overview.intro2")}</p>
      </section>

      <section className="charts-grid overview-grid">
        {cards.map(({ key, badge, question, description }) => (
          <article key={key} className="chart-card overview-card">
            <span className="overview-card__badge">{badge}</span>
            <h3 className="overview-card__question">{question}</h3>
            <p className="overview-card__description">{description}</p>
          </article>
        ))}
      </section>
    </>
  );
}
