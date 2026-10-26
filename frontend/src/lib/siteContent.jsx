import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { DEFAULT_SITE_CONTENT } from "./defaultContent";
import { apiUrl } from "./apiUrl";

const SiteContentContext = createContext({
  content: DEFAULT_SITE_CONTENT,
  loading: false,
  error: null,
  refreshContent: async () => {},
  hero: DEFAULT_SITE_CONTENT.hero,
  about: DEFAULT_SITE_CONTENT.about,
  services: DEFAULT_SITE_CONTENT.services,
  contact: DEFAULT_SITE_CONTENT.contact,
  footer: DEFAULT_SITE_CONTENT.footer,
  site: DEFAULT_SITE_CONTENT.site,
  sections: DEFAULT_SITE_CONTENT.sections,
});

// Nilai dari server bisa hanya memuat sebagian field (mis. footer lama tanpa
// grup tautan). Penggabungan dilakukan bertingkat supaya grup seperti
// footer.social, site.nav, dan sections.blog tidak hilang seluruhnya; array
// (highlights, navLinks) diganti utuh karena isinya berasal dari admin.
function mergeContent(defaults, fetched) {
  if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) {
    return fetched === undefined ? defaults : fetched;
  }
  const merged = { ...defaults };
  if (fetched && typeof fetched === "object" && !Array.isArray(fetched)) {
    for (const [key, value] of Object.entries(fetched)) {
      merged[key] = mergeContent(defaults[key], value);
    }
  }
  return merged;
}

// Key site_content yang boleh dikirim panel admin ke iframe pratinjau.
const PREVIEW_KEYS = [
  "hero",
  "about",
  "services",
  "contact",
  "footer",
  "site",
  "sections",
];

// Mode pratinjau hanya aktif bila halaman ini dimuat di dalam iframe dengan
// ?preview=1. Halaman publik biasa tidak pernah memasang listener apa pun,
// sehingga perilakunya identik seperti sebelumnya.
function isPreviewFrame() {
  if (typeof window === "undefined") return false;
  if (window.parent === window) return false;
  return new URLSearchParams(window.location.search).get("preview") === "1";
}

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Perubahan yang belum disimpan dari panel admin. Hanya di memori: tidak
  // pernah dikirim ke server maupun ditulis ke storage.
  const [previewOverrides, setPreviewOverrides] = useState(null);
  const [previewMode] = useState(isPreviewFrame);

  const fetchContent = useCallback(async () => {
    try {
      // no-store: endpoint publik ini memakai max-age=30 di server, dan setelah
      // admin menyimpan perubahan, pemuatan ulang harus menampilkan isi terbaru
      // (bukan salinan dari cache browser).
      const response = await fetch(apiUrl("/api/site-content"), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Gagal mengambil data konten situs.");
      }
      const data = await response.json();
      if (data && data.content) {
        setContent(mergeContent(DEFAULT_SITE_CONTENT, data.content));
      }
      setError(null);
    } catch (err) {
      setError(err);
      // Keep DEFAULT_SITE_CONTENT fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Menerima state formulir dari panel admin (parent) saat mode pratinjau.
  // Pesan hanya diterima dari origin yang sama dan dari window.parent.
  useEffect(() => {
    if (!previewMode) return undefined;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.parent) return;
      const data = event.data;
      if (!data || data.type !== "bumdesma:preview-content") return;
      if (!PREVIEW_KEYS.includes(data.key)) return;
      if (!data.content || typeof data.content !== "object") return;
      setPreviewOverrides((current) => ({ ...current, [data.key]: data.content }));
    };

    window.addEventListener("message", handleMessage);
    // Beri tahu panel bahwa listener sudah siap supaya state bisa dikirim ulang.
    window.parent.postMessage(
      { type: "bumdesma:preview-ready" },
      window.location.origin,
    );

    return () => window.removeEventListener("message", handleMessage);
  }, [previewMode]);

  // Halaman pratinjau tidak boleh diindeks mesin pencari.
  useEffect(() => {
    if (!previewMode) return undefined;
    const tag = document.createElement("meta");
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", "noindex");
    tag.setAttribute("data-preview", "true");
    document.head.appendChild(tag);
    return () => tag.remove();
  }, [previewMode]);

  // Deskripsi meta mengikuti identitas situs dari admin. Judul dokumen diatur
  // per halaman lewat usePageTitle supaya tidak saling menimpa.
  useEffect(() => {
    const description = content.site?.metaDescription;
    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", description);
  }, [content.site?.metaDescription]);

  // Di luar mode pratinjau nilainya persis `content` (identitas sama), jadi
  // tidak ada render tambahan pada situs publik biasa.
  const effectiveContent =
    previewMode && previewOverrides
      ? mergeContent(content, previewOverrides)
      : content;

  const value = useMemo(
    () => ({
      content: effectiveContent,
      loading,
      error,
      refreshContent: fetchContent,
      hero: effectiveContent.hero || DEFAULT_SITE_CONTENT.hero,
      about: effectiveContent.about || DEFAULT_SITE_CONTENT.about,
      services: effectiveContent.services || DEFAULT_SITE_CONTENT.services,
      contact: effectiveContent.contact || DEFAULT_SITE_CONTENT.contact,
      footer: effectiveContent.footer || DEFAULT_SITE_CONTENT.footer,
      site: effectiveContent.site || DEFAULT_SITE_CONTENT.site,
      sections: effectiveContent.sections || DEFAULT_SITE_CONTENT.sections,
    }),
    [effectiveContent, loading, error, fetchContent]
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteContent() {
  return useContext(SiteContentContext);
}
