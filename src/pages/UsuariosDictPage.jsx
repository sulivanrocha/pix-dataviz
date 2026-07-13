import { useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import { StatTile } from "../components/StatTile";
import { UsersGrowthChart } from "../components/UsersGrowthChart";
import { formatNumberCompact } from "../lib/format";

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function anoMesOf(dateStr) {
  return Number(dateStr.slice(0, 7).replace("-", ""));
}

export function UsuariosDictPage({ usuariosDict }) {
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

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label="Usuários cadastrados no DICT (total)"
          value={formatNumberCompact(latest.total)}
          delta={pctDelta(latest.total, previous?.total)}
        />
        <StatTile
          label="Pessoa física"
          value={formatNumberCompact(latest.pessoaFisica)}
          delta={pctDelta(latest.pessoaFisica, previous?.pessoaFisica)}
        />
        <StatTile
          label="Pessoa jurídica"
          value={formatNumberCompact(latest.pessoaJuridica)}
          delta={pctDelta(latest.pessoaJuridica, previous?.pessoaJuridica)}
        />
      </section>

      <Filters
        months={months}
        start={range.start}
        end={range.end}
        onStartChange={setStart}
        onEndChange={setEnd}
        hint="Filtra o gráfico de crescimento abaixo."
      />

      <section className="charts-grid">
        <UsersGrowthChart usuariosDict={filtered} />
      </section>
    </>
  );
}
