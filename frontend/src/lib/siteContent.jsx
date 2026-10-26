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

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Deskripsi meta mengikuti identitas situs dari admin. Judul dokumen diatur
  // per halaman lewat usePageTitle supaya tidak saling menimpa.
  useEffect(() => {
    const description = content.site?.metaDescription;
    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", description);
  }, [content.site?.metaDescription]);

  const value = useMemo(
    () => ({
      content,
      loading,
      error,
      refreshContent: fetchContent,
      hero: content.hero || DEFAULT_SITE_CONTENT.hero,
      about: content.about || DEFAULT_SITE_CONTENT.about,
      services: content.services || DEFAULT_SITE_CONTENT.services,
      contact: content.contact || DEFAULT_SITE_CONTENT.contact,
      footer: content.footer || DEFAULT_SITE_CONTENT.footer,
      site: content.site || DEFAULT_SITE_CONTENT.site,
      sections: content.sections || DEFAULT_SITE_CONTENT.sections,
    }),
    [content, loading, error, fetchContent]
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
