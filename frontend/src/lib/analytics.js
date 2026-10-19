// Analitik opsional (Umami/Plausible-compatible). Tidak ada skrip yang dimuat
// tanpa VITE_ANALYTICS_SRC dan VITE_ANALYTICS_SITE_ID, jadi build biasa tetap
// bebas pelacak. Nilai SRC wajib https:// supaya skrip tidak bisa dimuat lewat
// http biasa maupun URL relatif.
const SCRIPT_ID = "bumdesma-analytics";

let initialized = false;

export function initAnalytics() {
  // Dipanggil sekali dari main.jsx, tetapi penjagaan ini membuat pemanggilan
  // berikutnya (mis. saat hot reload) tidak menambah skrip kedua.
  if (initialized || document.getElementById(SCRIPT_ID)) return;

  const src = import.meta.env.VITE_ANALYTICS_SRC;
  const siteId = import.meta.env.VITE_ANALYTICS_SITE_ID;
  if (!src || !siteId || !src.startsWith("https://")) return;

  // Panel admin tidak ikut diukur.
  if (window.location.pathname.startsWith("/admin")) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = src;
  script.defer = true;
  script.dataset.websiteId = siteId;
  script.dataset.doNotTrack = "true";
  document.head.appendChild(script);

  initialized = true;
}
