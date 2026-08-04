// src/lib/format.js
// Formatação de números, moeda e datas sensível ao idioma.
//
// O idioma ativo é guardado em estado de módulo e atualizado por
// `setFormatLocale(lang)`, chamado pelo I18nProvider sempre que o idioma muda.
// Assim, todos os call sites existentes (formatCurrencyCompact(x), etc.)
// continuam funcionando sem mudança de assinatura, mas passam a respeitar o
// idioma. A moeda permanece BRL nos dois idiomas (o dado é em reais); só o
// locale de agrupamento/notação muda.

const LOCALES = { pt: "pt-BR", en: "en-US" };

let currentLang = "pt";

const formatters = buildFormatters("pt-BR");

function buildFormatters(locale) {
  return {
    currencyCompact: new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }),
    numberCompact: new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }),
    numberFull: new Intl.NumberFormat(locale),
    currencyFull: new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }),
  };
}

/** Chamado pelo I18nProvider quando o idioma muda. */
export function setFormatLocale(lang) {
  currentLang = lang === "en" ? "en" : "pt";
  const locale = LOCALES[currentLang];
  Object.assign(formatters, buildFormatters(locale));
}

export function getFormatLang() {
  return currentLang;
}

export function formatCurrencyCompact(value) {
  return formatters.currencyCompact.format(value);
}

export function formatNumberCompact(value) {
  return formatters.numberCompact.format(value);
}

export function formatNumberFull(value) {
  return formatters.numberFull.format(value);
}

export function formatCurrencyFull(value) {
  return formatters.currencyFull.format(value);
}

const MONTHS = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

// AnoMes no formato AAAAMM (ex.: 202505) -> "mai/25" (pt) ou "May/25" (en)
export function formatAnoMes(anoMes) {
  const year = Math.floor(anoMes / 100);
  const month = anoMes % 100;
  const names = MONTHS[currentLang] ?? MONTHS.pt;
  return `${names[month - 1]}/${String(year).slice(2)}`;
}
