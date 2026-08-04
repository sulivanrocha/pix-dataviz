// Cores por categoria: ordem fixa por dimensão (nunca ciclada) seguindo a
// paleta categórica do dataviz skill. Valores "não informado/disponível"
// sempre em cinza neutro, nunca ocupam um slot de hue.
const MUTED = "var(--text-muted)";

const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

function buildPalette(order) {
  const map = {};
  let i = 0;
  for (const key of order) {
    map[key] = key.startsWith("Nao") ? MUTED : SERIES[i++];
  }
  return map;
}

export const DIMENSIONS = {
  porPFPJPagador: {
    label: "Pessoa física x jurídica (pagador)",
    labelEn: "Individual vs. business (payer)",
    order: ["PF", "PJ", "Nao disponivel"],
    labels: { PF: "Pessoa física", PJ: "Pessoa jurídica", "Nao disponivel": "Não disponível" },
    labelsEn: { PF: "Individual", PJ: "Business", "Nao disponivel": "Not available" },
  },
  porRegiaoPagador: {
    label: "Região do pagador",
    labelEn: "Payer region",
    order: ["SUDESTE", "NORDESTE", "SUL", "NORTE", "CENTRO-OESTE", "Nao informado"],
    labels: {
      SUDESTE: "Sudeste",
      NORDESTE: "Nordeste",
      SUL: "Sul",
      NORTE: "Norte",
      "CENTRO-OESTE": "Centro-Oeste",
      "Nao informado": "Não informado",
    },
    labelsEn: {
      SUDESTE: "Southeast",
      NORDESTE: "Northeast",
      SUL: "South",
      NORTE: "North",
      "CENTRO-OESTE": "Central-West",
      "Nao informado": "Not reported",
    },
  },
  porNatureza: {
    label: "Natureza da transação",
    labelEn: "Transaction nature",
    order: ["P2P", "P2B", "B2P", "B2B", "P2G", "B2G", "G2P", "G2B", "G2G", "Nao disponivel"],
    labels: {
      P2P: "Pessoa → Pessoa",
      P2B: "Pessoa → Empresa",
      B2P: "Empresa → Pessoa",
      B2B: "Empresa → Empresa",
      P2G: "Pessoa → Governo",
      B2G: "Empresa → Governo",
      G2P: "Governo → Pessoa",
      G2B: "Governo → Empresa",
      G2G: "Governo → Governo",
      "Nao disponivel": "Não disponível",
    },
    labelsEn: {
      P2P: "Person → Person",
      P2B: "Person → Business",
      B2P: "Business → Person",
      B2B: "Business → Business",
      P2G: "Person → Government",
      B2G: "Business → Government",
      G2P: "Government → Person",
      G2B: "Government → Business",
      G2G: "Government → Government",
      "Nao disponivel": "Not available",
    },
  },
  porFinalidade: {
    label: "Finalidade",
    labelEn: "Purpose",
    order: ["Pix", "Pix Saque", "Pix Troco", "Nao disponivel"],
    labels: {
      Pix: "Transferência",
      "Pix Saque": "Saque",
      "Pix Troco": "Troco",
      "Nao disponivel": "Não disponível",
    },
    labelsEn: {
      Pix: "Transfer",
      "Pix Saque": "Withdrawal",
      "Pix Troco": "Cash back",
      "Nao disponivel": "Not available",
    },
  },
  porFormaIniciacao: {
    label: "Forma de iniciação",
    labelEn: "Initiation method",
    order: ["DICT", "QRES", "QRDN", "MANU", "INIC", "AUTO", "APDN", "APES", "Nao disponivel"],
    labels: {
      DICT: "Chave Pix",
      QRES: "QR Code estático",
      QRDN: "QR Code dinâmico",
      MANU: "Inserção manual",
      INIC: "Iniciador de pagamento",
      AUTO: "Pix automático",
      APDN: "Aproximação",
      APES: "Aproximação estática",
      "Nao disponivel": "Não disponível",
    },
    labelsEn: {
      DICT: "Pix key",
      QRES: "Static QR code",
      QRDN: "Dynamic QR code",
      MANU: "Manual entry",
      INIC: "Payment initiator",
      AUTO: "Automatic Pix",
      APDN: "Contactless",
      APES: "Static contactless",
      "Nao disponivel": "Not available",
    },
  },
};

for (const dim of Object.values(DIMENSIONS)) {
  dim.colors = buildPalette(dim.order);
}

/*
 * Natureza tem estrutura de familia (X2Y): a cor codifica o pagador (primeira
 * letra) numa mesma matiz e o recebedor (segunda letra) em tres tons. Assim,
 * tudo que "Pessoa paga" fica azul, "Empresa paga" verde, "Governo paga" ambar
 * — e dentro de cada familia P->B->G vai do claro ao escuro. As variaveis
 * --nat-* sao definidas em index.css, com variante para tema escuro.
 * "Nao disponivel" continua cinza e some do grafico (filtrado na exibicao).
 */
DIMENSIONS.porNatureza.colors = {
  P2P: "var(--nat-p-1)",
  P2B: "var(--nat-p-2)",
  P2G: "var(--nat-p-3)",
  B2P: "var(--nat-b-1)",
  B2B: "var(--nat-b-2)",
  B2G: "var(--nat-b-3)",
  G2P: "var(--nat-g-1)",
  G2B: "var(--nat-g-2)",
  G2G: "var(--nat-g-3)",
  "Nao disponivel": MUTED,
};

export function categoryLabel(dimensionKey, categoria, lang = "pt") {
  const dim = DIMENSIONS[dimensionKey];
  if (!dim) return categoria;
  const table = lang === "en" ? dim.labelsEn ?? dim.labels : dim.labels;
  return table[categoria] ?? dim.labels[categoria] ?? categoria;
}

export function dimensionLabel(dimensionKey, lang = "pt") {
  const dim = DIMENSIONS[dimensionKey];
  if (!dim) return dimensionKey;
  return lang === "en" ? dim.labelEn ?? dim.label : dim.label;
}

export function categoryColor(dimensionKey, categoria) {
  return DIMENSIONS[dimensionKey]?.colors[categoria] ?? MUTED;
}

export function sortByDimensionOrder(dimensionKey, categorias) {
  const order = DIMENSIONS[dimensionKey]?.order ?? [];
  return [...categorias].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}