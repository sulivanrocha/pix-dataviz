const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const ENABLED = Boolean(MEASUREMENT_ID) && import.meta.env.PROD

let initialized = false

export function initAnalytics() {
  if (!ENABLED || initialized) return
  if (typeof window === "undefined") return

  initialized = true

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  gtag("js", new Date())
  gtag("config", MEASUREMENT_ID, {
    // Cookieless mode: no cookies written, no consent banner required.
    // Remove this line if you later add a consent banner and want
    // accurate returning-visitor / session metrics.
    client_storage: "none",
    anonymize_ip: true,
    send_page_view: true,
  })
}

export function trackEvent(name, params = {}) {
  if (!ENABLED) return
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", name, params)
}

export function trackTabView(tabId) {
  trackEvent("tab_view", { tab_id: tabId })
}