import { useMemo, useState } from "react";
import { StatTile } from "../components/shared/StatTile";
import { UsersGrowthChart } from "../components/charts/dict/UsersGrowthChart";
import { formatAnoMes, formatNumberCompact } from "../lib/format";

function pctDelta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function anoMesOf(dateStr) {
  return Number(dateStr.slice(0, 7).replace("-", ""));
}

const DICT_DEFINITIONS = [
  {
    term: "DICT (Diretório de Identificadores de Contas Transacionais)",
    description:
      "Base de dados mantida pelo Banco Central que armazena o vínculo entre as chaves Pix e as contas transacionais dos usuários recebedores. É o componente do arranjo Pix que permite localizar a conta de destino a partir de uma chave, dispensando a troca manual de dados bancários.",
  },
  {
    term: "Usuário cadastrado no DICT",
    description:
      "Pessoa física ou jurídica que possui ao menos uma chave Pix registrada no DICT, vinculada a uma conta transacional em uma instituição participante do Pix.",
  },
  {
    term: "Pessoa física (PF)",
    description:
      "Usuários cadastrados no DICT identificados por CPF, ou que tenham vinculado ao menos uma chave (CPF, e-mail, celular ou chave aleatória) a uma conta de titularidade individual.",
  },
  {
    term: "Pessoa jurídica (PJ)",
    description:
      "Usuários cadastrados no DICT identificados por CNPJ, vinculados a contas transacionais de empresas ou outras entidades jurídicas.",
  },
  {
    term: "Chave Pix",
    description:
      "Apelido cadastrado no DICT (CPF/CNPJ, e-mail, número de celular ou chave aleatória) que identifica uma conta transacional específica, usado para iniciar pagamentos sem a necessidade de informar dados bancários completos.",
  },
];

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

  const referenceMonth = useMemo(() => {
    if (!latest?.data) {
      return "último mês disponível";
    }

    return formatAnoMes(anoMesOf(latest.data));
  }, [latest]);

  return (
    <>
      <section className="kpi-row">
        <StatTile
          label={`Usuários cadastrados no DICT (${referenceMonth})`}
          value={formatNumberCompact(latest.total)}
          delta={pctDelta(latest.total, previous?.total)}
        />
        <StatTile
          label={`Pessoa física (${referenceMonth})`}
          value={formatNumberCompact(latest.pessoaFisica)}
          delta={pctDelta(latest.pessoaFisica, previous?.pessoaFisica)}
        />
        <StatTile
          label={`Pessoa jurídica (${referenceMonth})`}
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

      <section className="definitions-section">
        <span className="definitions-eyebrow">Glossário</span>
        <h3>Definições</h3>
        <dl>
          {DICT_DEFINITIONS.map(({ term, description }) => (
            <div key={term} className="definitions-item">
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}