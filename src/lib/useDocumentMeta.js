// src/lib/useDocumentMeta.js
// Sincroniza <title>, description, canonical e tags Open Graph / Twitter
// a cada mudança de rota. Sem isso, todas as URLs reportariam os mesmos
// metadados ao Google, anulando o ganho de ter rotas separadas.
// Consumido por: App.jsx

import { useEffect } from "react";
import { absoluteUrl, SITE_NAME } from "./tabs";

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
export function useDocumentMeta(tab) {
  useEffect(() => {
    if (!tab) return;

    const url = absoluteUrl(tab.path);

    document.title = tab.title;
    setMetaByName("description", tab.description);
    setCanonical(url);

    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:site_name", SITE_NAME);
    setMetaByProperty("og:locale", "pt_BR");
    setMetaByProperty("og:title", tab.title);
    setMetaByProperty("og:description", tab.description);
    setMetaByProperty("og:url", url);

    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", tab.title);
    setMetaByName("twitter:description", tab.description);
  }, [tab]);
}