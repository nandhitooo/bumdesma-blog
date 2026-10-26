import { useEffect } from "react";
import { useSiteContent } from "./siteContent";

// Judul tab memakai nama lembaga dari panel admin, bukan string tetap di
// masing-masing halaman. Tanpa judul halaman, dipakai metaTitle situs.
export function usePageTitle(title) {
  const { site } = useSiteContent();

  useEffect(() => {
    document.title = title ? `${title} | ${site.name}` : site.metaTitle;
  }, [title, site.name, site.metaTitle]);
}
