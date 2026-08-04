// src/lib/tabs.js
// Fonte única de verdade: rota, rótulo de navegação e metadados de SEO por aba.
// Consumido por: App.jsx (rotas), TabNav.jsx (navegação),
// useDocumentMeta.js (title/canonical/OG) e public/sitemap.xml.

export const SITE_URL = "https://www.dadospix.com.br";
export const SITE_NAME = "Dados do Pix";

// Cada aba carrega SEO nos dois idiomas. `labelKey` aponta para messages.nav.*
// (usado pela navegação); title/description ptBR|en alimentam useDocumentMeta.
export const TABS = [
  {
    key: "overview",
    labelKey: "nav.overview",
    label: "Visão geral",
    path: "/",
    title: "Dados do Pix — visualizações dos dados abertos do Banco Central",
    description:
      "Painel independente com as estatísticas públicas do Pix: usuários, chaves, transações por município e volume mensal. Dados abertos do Banco Central do Brasil em gráficos interativos.",
    titleEn: "Pix Data — visualizations of the Central Bank of Brazil's open data",
    descriptionEn:
      "Independent dashboard of public Pix statistics: users, keys, transactions by municipality, and monthly volume. Central Bank of Brazil open data in interactive charts.",
  },
  {
    key: "dict",
    labelKey: "nav.dict",
    label: "Usuários",
    path: "/usuarios",
    title: "Quantas pessoas e empresas têm Pix — usuários no DICT | Dados do Pix",
    description:
      "Estoque mensal de usuários pessoa física e jurídica cadastrados no DICT, desde 2020. Acompanhe a adoção do Pix no Brasil mês a mês, com dados abertos do Banco Central.",
    titleEn: "How many people and businesses use Pix — DICT users | Pix Data",
    descriptionEn:
      "Monthly stock of individual and business users registered in the DICT since 2020. Track Pix adoption in Brazil month by month, with Central Bank open data.",
  },
  {
    key: "chaves",
    labelKey: "nav.chaves",
    label: "Chaves",
    path: "/chaves",
    title: "Quantas chaves Pix existem — total e por instituição | Dados do Pix",
    description:
      "Estoque de chaves Pix registradas no DICT por tipo (CPF, CNPJ, e-mail, celular e chave aleatória), com evolução histórica e distribuição entre as instituições participantes.",
    titleEn: "How many Pix keys exist — total and by institution | Pix Data",
    descriptionEn:
      "Stock of Pix keys registered in the DICT by type (CPF, CNPJ, email, phone, and random key), with historical evolution and distribution across participating institutions.",
  },
  {
    key: "municipio",
    labelKey: "nav.municipio",
    label: "Transações por Município",
    path: "/municipios",
    title: "Transações Pix por município, estado e região | Dados do Pix",
    description:
      "Valor e quantidade de transações Pix por estado e região, a partir do dado bruto por município. Compare a intensidade de uso do Pix entre as unidades da federação.",
    titleEn: "Pix transactions by municipality, state, and region | Pix Data",
    descriptionEn:
      "Value and volume of Pix transactions by state and region, from the raw per-municipality data. Compare Pix usage intensity across the federal units.",
  },
  {
    key: "transacoes",
    labelKey: "nav.transacoes",
    label: "Estatísticas de Transações",
    path: "/transacoes",
    title: "Quanto o Pix movimenta por mês — valor e volume | Dados do Pix",
    description:
      "Total mensal de valor e quantidade de transações Pix, com composição por natureza, finalidade, forma de iniciação, região e tipo de pagador (PF/PJ).",
    titleEn: "How much Pix moves per month — value and volume | Pix Data",
    descriptionEn:
      "Monthly total of Pix transaction value and volume, with breakdown by nature, purpose, initiation method, region, and payer type (individual/business).",
  },
];

/** SEO title/description da aba no idioma dado. */
export function tabSeo(tab, lang) {
  if (lang === "en") {
    return {
      title: tab.titleEn ?? tab.title,
      description: tab.descriptionEn ?? tab.description,
    };
  }
  return { title: tab.title, description: tab.description };
}

export const DEFAULT_TAB = TABS[0];

/** Aba correspondente a um pathname. Cai na Visão geral se não houver match. */
export function tabFromPath(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return TABS.find((tab) => tab.path === clean) ?? DEFAULT_TAB;
}

/** Aba correspondente a uma key. Cai na Visão geral se não houver match. */
export function tabByKey(key) {
  return TABS.find((tab) => tab.key === key) ?? DEFAULT_TAB;
}

/** URL absoluta e canônica de uma aba — usada em canonical, OG e sitemap. */
export function absoluteUrl(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}