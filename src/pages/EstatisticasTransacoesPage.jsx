import { useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import { StatTile } from "../components/StatTile";
import { TrendChart } from "../components/TrendChart";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { formatAnoMes, formatCurrencyCompact, formatCurrencyFull, formatNumberCompact } from "../lib/format";

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function EstatisticasTransacoesPage({ transacoes }) {
  const mensal = transacoes.mensal;
  const months = useMemo(() => [...new Set(mensal.map((r) => r.AnoMes))].sort(), [mensal]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const range = { start: start ?? months[0], end: end ?? months[months.length - 1] };

  const latest = mensal[mensal.length - 1];
  const previous = mensal[mensal.length - 2];

  return (
    <>
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
        <StatTile label="Ticket médio" value={formatCurrencyFull(latest.VALOR / latest.QUANTIDADE)} />
      </section>

      <Filters
        months={months}
        start={range.start}
        end={range.end}
        onStartChange={setStart}
        onEndChange={setEnd}
        hint="Filtra os gráficos de volume e categorias abaixo."
      />

      <section className="charts-grid">
        <TrendChart mensal={mensal} start={range.start} end={range.end} />
        <CategoryBreakdown transacoes={transacoes} start={range.start} end={range.end} />
      </section>
    </>
  );
}
