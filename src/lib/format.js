const currencyCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberCompact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFull = new Intl.NumberFormat("pt-BR");

const currencyFull = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyCompact(value) {
  return currencyCompact.format(value);
}

export function formatNumberCompact(value) {
  return numberCompact.format(value);
}

export function formatNumberFull(value) {
  return numberFull.format(value);
}

export function formatCurrencyFull(value) {
  return currencyFull.format(value);
}

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

// AnoMes no formato AAAAMM (ex.: 202505) -> "mai/25"
export function formatAnoMes(anoMes) {
  const year = Math.floor(anoMes / 100);
  const month = anoMes % 100;
  return `${MONTHS[month - 1]}/${String(year).slice(2)}`;
}
