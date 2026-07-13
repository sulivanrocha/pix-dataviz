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
    order: ["PF", "PJ", "Nao disponivel"],
    labels: { PF: "Pessoa física", PJ: "Pessoa jurídica", "Nao disponivel": "Não disponível" },
  },
  porRegiaoPagador: {
    label: "Região do pagador",
    order: ["SUDESTE", "NORDESTE", "SUL", "NORTE", "CENTRO-OESTE", "Nao informado"],
    labels: {
      SUDESTE: "Sudeste",
      NORDESTE: "Nordeste",
      SUL: "Sul",
      NORTE: "Norte",
      "CENTRO-OESTE": "Centro-Oeste",
      "Nao informado": "Não informado",
    },
  },
  porNatureza: {
    label: "Natureza da transação",
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
  },
  porFinalidade: {
    label: "Finalidade",
    order: ["Pix", "Pix Saque", "Pix Troco", "Nao disponivel"],
    labels: {
      Pix: "Transferência",
      "Pix Saque": "Saque",
      "Pix Troco": "Troco",
      "Nao disponivel": "Não disponível",
    },
  },
  porFormaIniciacao: {
    label: "Forma de iniciação",
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
  },
};

for (const dim of Object.values(DIMENSIONS)) {
  dim.colors = buildPalette(dim.order);
}

export function categoryLabel(dimensionKey, categoria) {
  return DIMENSIONS[dimensionKey]?.labels[categoria] ?? categoria;
}

export function categoryColor(dimensionKey, categoria) {
  return DIMENSIONS[dimensionKey]?.colors[categoria] ?? MUTED;
}

export function sortByDimensionOrder(dimensionKey, categorias) {
  const order = DIMENSIONS[dimensionKey]?.order ?? [];
  return [...categorias].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
