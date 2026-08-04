// src/lib/i18n/I18nContext.jsx
// Núcleo de internacionalização. Mantém o idioma ativo (pt/en), persiste a
// escolha em localStorage, sincroniza <html lang> e expõe uma função `t()`.
//
// Decisão de arquitetura: é um toggle de UI puro — o idioma NÃO vive na URL.
// A mesma rota (/usuarios, /chaves, ...) serve os dois idiomas; só o texto
// renderizado muda. Isso mantém o roteamento e o SEO existentes intactos.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { messages } from "./messages";
import { setFormatLocale } from "../format";

const STORAGE_KEY = "pix-dataviz-lang";
const DEFAULT_LANG = "pt";
const SUPPORTED = ["pt", "en"];

const I18nContext = createContext(null);

/** Lê a preferência salva; cai no padrão se ausente ou inválida. */
function readInitialLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;

  // Detecção suave pelo idioma do navegador na primeira visita.
  const nav = window.navigator?.language ?? "";
  if (nav.toLowerCase().startsWith("en")) return "en";

  return DEFAULT_LANG;
}

/**
 * Resolve uma chave "a.b.c" no dicionário do idioma ativo.
 * Cai no português e, por fim, na própria chave — nunca quebra o render.
 */
function resolve(lang, key) {
  const fromLang = getPath(messages[lang], key);
  if (fromLang !== undefined) return fromLang;

  const fromDefault = getPath(messages[DEFAULT_LANG], key);
  if (fromDefault !== undefined) return fromDefault;

  return key;
}

function getPath(obj, key) {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, obj);
}

/** Interpola {placeholders} numa string com valores de `vars`. */
function interpolate(template, vars) {
  if (typeof template !== "string" || !vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const initial = readInitialLang();
    // Sincroniza os formatadores antes do primeiro render, para que datas e
    // números já saiam no locale correto na carga inicial.
    setFormatLocale(initial);
    return initial;
  });

  useEffect(() => {
    setFormatLocale(lang);
  }, [lang]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "pt" ? "en" : "pt"));
  }, []);

  const t = useCallback(
    (key, vars) => interpolate(resolve(lang, key), vars),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n precisa estar dentro de <I18nProvider>");
  }
  return ctx;
}
