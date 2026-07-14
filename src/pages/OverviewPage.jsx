const RESOURCES = [
  {
    tab: "Usuários",
    question: "Quantas pessoas e empresas já têm Pix?",
    description:
      "Estoque mensal de usuários pessoa física e jurídica cadastrados no DICT — o diretório que vincula chaves Pix a contas transacionais. Mostra a adoção do Pix ao longo do tempo, desde 2020.",
  },
  {
    tab: "Chaves",
    question: "Quantas chaves Pix existem e onde estão?",
    description:
      "Estoque de chaves Pix registradas no DICT (CPF/CNPJ, e-mail, celular e chave aleatória), com a evolução histórica e a distribuição entre as instituições participantes do arranjo.",
  },
  {
    tab: "Transações por Município",
    question: "Como o Pix se distribui pelo território?",
    description:
      "Valor e quantidade de transações Pix agregados por estado e região, a partir do dado bruto por município. Permite comparar a intensidade de uso do Pix entre as unidades da federação.",
  },
  {
    tab: "Estatísticas de Transações",
    question: "Quanto e como o Pix movimenta por mês?",
    description:
      "Total mensal de valor e quantidade de transações, com a composição por natureza, finalidade, forma de iniciação, região e tipo de pagador (PF/PJ). É a visão macro do fluxo do Pix.",
  },
];

export function OverviewPage() {
  return (
    <>
      <section className="overview-intro">
        <span className="overview-intro__eyebrow">Visão geral</span>
        <h2>O que você encontra neste painel</h2>
        <p>
          Este é um projeto independente que reúne, em um só lugar, as principais estatísticas
          públicas do Pix divulgadas pelo Banco Central do Brasil. Os números vêm da API de dados
          abertos do BC, mas as visualizações, os recortes e a interface são de autoria própria — não
          se trata de um canal oficial do Banco Central.
        </p>
        <p>
          Os dados são servidos como um snapshot estático, gerado periodicamente a partir da API.
          Cada aba abaixo corresponde a um conjunto de dados diferente. Comece pela pergunta que você
          quer responder.
        </p>
      </section>

      <section className="charts-grid overview-grid">
        {RESOURCES.map(({ tab, question, description }) => (
          <article key={tab} className="chart-card overview-card">
            <span className="overview-card__badge">{tab}</span>
            <h3 className="overview-card__question">{question}</h3>
            <p className="overview-card__description">{description}</p>
          </article>
        ))}
      </section>
    </>
  );
}