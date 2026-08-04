import { useMemo, useState } from "react";
import { StatTile } from "../components/shared/StatTile";
import { Glossary } from "../components/shared/Glossary";
import { UsersGrowthChart } from "../components/charts/dict/UsersGrowthChart";
import { formatAnoMes, formatNumberCompact } from "../lib/format";
import { useI18n } from "../lib/i18n/I18nContext";
import { getGlossary } from "../lib/i18n/glossary";

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function anoMesOf(dateStr) {
  return Number(dateStr.slice(0, 7).replace("-", ""));
}

export function UsuariosDictPage({ usuariosDict }) {
  const { t, lang } = useI18n();
  const months = useMemo(() => [...new Set(usuariosDict.map((r) => anoMesOf(r.data)))].sort(), [usuariosDict]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const range = { start: start ?? months[0], end: end ?? months[months.length - 1] };

  const filtered = useMemo(
    () => usuariosDict.filter((r) => {
      const m = anoMesOf(r.data);
      return m >= range.start && m <= range.end;
    }),
    [usuariosDict, range.start, range.end]
  );

  const latest = usuariosDict[usuariosDict.length - 1];
  const previous = usuariosDict[usuariosDict.length - 2];

  const referenceMonth = useMemo(() => {
    if (!latest?.data) {
      return t("common.latestMonth");
    }

    return formatAnoMes(anoMesOf(latest.data));
  }, [latest, t]);

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label={t("dictPage.kpiTotal", { month: referenceMonth })}
          value={formatNumberCompact(latest.total)}
          delta={pctDelta(latest.total, previous?.total)}
        />
        <StatTile
          label={t("dictPage.kpiPf", { month: referenceMonth })}
          value={formatNumberCompact(latest.pessoaFisica)}
          delta={pctDelta(latest.pessoaFisica, previous?.pessoaFisica)}
        />
        <StatTile
          label={t("dictPage.kpiPj", { month: referenceMonth })}
          value={formatNumberCompact(latest.pessoaJuridica)}
          delta={pctDelta(latest.pessoaJuridica, previous?.pessoaJuridica)}
        />
      </section>

      <section className="charts-grid">
        <UsersGrowthChart
          usuariosDict={filtered}
          months={months}
          start={range.start}
          end={range.end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />
      </section>

      <Glossary items={getGlossary("dict", lang)} />
    </>
  );
}
