import { useMemo, useState } from "react";
import { Filters } from "../components/shared/Filters";
import { StatTile } from "../components/shared/StatTile";
import { TrendChart } from "../components/charts/transacoes/TrendChart";
import { CategoryBreakdown } from "../components/charts/transacoes/CategoryBreakdown";
import { NaturezaMatrix } from "../components/charts/transacoes/NaturezaMatrix";
import { DIMENSIONS, dimensionLabel } from "../lib/categories";
import { Glossary } from "../components/shared/Glossary";
import { useI18n } from "../lib/i18n/I18nContext";
import { getGlossary } from "../lib/i18n/glossary";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull, formatNumberCompact } from "../lib/format";

/**
 * Visões (métrica) disponíveis nesta base.
 *
 * O cubo de transações só traz valor e quantidade — não há contagem de pessoas
 * como no cubo de municípios, então a visão "Pessoas" não existe aqui.
 */
const VISAO_VALUES = ["VALOR", "QUANTIDADE"];

/**
 * Dimensões cruzadas disponíveis, na ordem em que aparecem no seletor.
 * Reaproveita os rótulos de categories.js — a mesma fonte usada nos gráficos.
 */
const DIMENSION_KEYS = Object.keys(DIMENSIONS);

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function EstatisticasTransacoesPage({ transacoes }) {
  const { t, lang } = useI18n();
  const mensal = transacoes.mensal;
  const VISOES = VISAO_VALUES.map((value) => ({
    value,
    label: value === "VALOR" ? t("common.valueBRL") : t("common.transactions"),
  }));
  const months = useMemo(() => [...new Set(mensal.map((r) => r.AnoMes))].sort(), [mensal]);

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  /**
   * Filtros de página, no mesmo espírito da página de municípios: um controle
   * de Visão (métrica) e um de Dimensão que regem todos os gráficos abaixo.
   */
  const [visao, setVisao] = useState("VALOR");
  const [dimensionKey, setDimensionKey] = useState("porNatureza");

  const range = { start: start ?? months[0], end: end ?? months[months.length - 1] };

  const latest = mensal[mensal.length - 1];
  const previous = mensal[mensal.length - 2];

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label={t("transacoesPage.kpiValue", { month: formatAnoMes(latest.AnoMes) })}
          value={formatCurrencyCompact(latest.VALOR)}
          delta={pctDelta(latest.VALOR, previous?.VALOR)}
        />
        <StatTile
          label={t("transacoesPage.kpiCount", { month: formatAnoMes(latest.AnoMes) })}
          value={formatNumberCompact(latest.QUANTIDADE)}
          delta={pctDelta(latest.QUANTIDADE, previous?.QUANTIDADE)}
        />
        <StatTile label={t("transacoesPage.kpiTicket")} value={formatCurrencyFull(latest.VALOR / latest.QUANTIDADE)} />
      </section>

      <Filters
        months={months}
        start={range.start}
        end={range.end}
        onStartChange={setStart}
        onEndChange={setEnd}
        hint={t("transacoesPage.filterHint")}
      >
        <label>
          {t("common.view")}
          <select value={visao} onChange={(event) => setVisao(event.target.value)}>
            {VISOES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("common.dimension")}
          <select
            value={dimensionKey}
            onChange={(event) => setDimensionKey(event.target.value)}
          >
            {DIMENSION_KEYS.map((key) => (
              <option key={key} value={key}>
                {dimensionLabel(key, lang)}
              </option>
            ))}
          </select>
        </label>
      </Filters>

      {/*
        Volume mês a mês (colunas). Só a Visão o afeta — a dimensão não se
        aplica ao total geral.
      */}
      <section className="charts-grid">
        <TrendChart
          mensal={mensal}
          start={range.start}
          end={range.end}
          metric={visao}
        />
      </section>

      {/*
        Duas leituras da mesma dimensão, lado a lado:
        - à esquerda, empilhado absoluto (tamanho de cada categoria);
        - à direita, composição 100% (como a participação muda no tempo).
        Nenhum recebe fullWidth: o charts-grid os coloca em duas colunas.
      */}
      <section className="charts-grid">
        <CategoryBreakdown
          transacoes={transacoes}
          start={range.start}
          end={range.end}
          dimensionKey={dimensionKey}
          metric={visao}
          mode="absolute"
        />

        <CategoryBreakdown
          transacoes={transacoes}
          start={range.start}
          end={range.end}
          dimensionKey={dimensionKey}
          metric={visao}
          mode="share"
        />
      </section>

      {/*
        Matriz pagador x recebedor. Tem seu próprio slider de mês e não recebe
        start/end de propósito: cruzar as duas pontas só faz sentido em um
        recorte temporal único.
      */}
      <section className="charts-grid">
        <NaturezaMatrix porNatureza={transacoes.porNatureza} />
      </section>

      <Glossary items={getGlossary("transacoes", lang)} />
    </>
  );
}