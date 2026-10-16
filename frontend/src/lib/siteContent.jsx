import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { DEFAULT_SITE_CONTENT } from "./defaultContent";

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
});

function mergeContent(fetched) {
  if (!fetched || typeof fetched !== "object") return DEFAULT_SITE_CONTENT;
  return {
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...fetched.hero },
    about: { ...DEFAULT_SITE_CONTENT.about, ...fetched.about },
    services: {
      items: Array.isArray(fetched.services?.items)
        ? fetched.services.items
        : DEFAULT_SITE_CONTENT.services.items,
    },
    contact: { ...DEFAULT_SITE_CONTENT.contact, ...fetched.contact },
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...fetched.footer,
      social: {
        ...DEFAULT_SITE_CONTENT.footer.social,
        ...fetched.footer?.social,
      },
    },
  };
}

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch("/api/site-content");
      if (!response.ok) {
        throw new Error("Gagal mengambil data konten situs.");
      }
      const data = await response.json();
      if (data && data.content) {
        setContent(mergeContent(data.content));
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
