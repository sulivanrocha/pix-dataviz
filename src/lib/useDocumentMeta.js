// src/lib/useDocumentMeta.js
// Sincroniza <title>, description, canonical e tags Open Graph / Twitter
// a cada mudança de rota. Sem isso, todas as URLs reportariam os mesmos
// metadados ao Google, anulando o ganho de ter rotas separadas.
// Consumido por: App.jsx

import { useEffect } from "react";
import { absoluteUrl, SITE_NAME, tabSeo } from "./tabs";

/** Cria ou atualiza <meta name="..."> no <head>. */
function setMetaByName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Cria ou atualiza <meta property="..."> no <head> (Open Graph). */
function setMetaByProperty(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Cria ou atualiza <link rel="canonical"> no <head>. */
function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Aplica os metadados da aba ativa ao <head>.
 * @param {{ title: string, description: string, path: string }} tab
 */
export function useDocumentMeta(tab, lang = "pt") {
  useEffect(() => {
    if (!tab) return;

    const url = absoluteUrl(tab.path);
    const { title, description } = tabSeo(tab, lang);
    const ogLocale = lang === "en" ? "en_US" : "pt_BR";

    document.title = title;
    setMetaByName("description", description);
    setCanonical(url);

    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:site_name", SITE_NAME);
    setMetaByProperty("og:locale", ogLocale);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", url);

    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", title);
    setMetaByName("twitter:description", description);
  }, [tab, lang]);
}