import { useEffect } from "react";
import { useSiteContent } from "./siteContent";

// Tag <head> yang dikelola hook ini. `attribute` adalah atribut selector-nya:
// meta standar memakai `name`, Open Graph memakai `property`.
const MANAGED_META = [
  { attribute: "name", key: "description" },
  { attribute: "property", key: "og:title" },
  { attribute: "property", key: "og:description" },
  { attribute: "property", key: "og:url" },
  { attribute: "property", key: "og:type" },
  { attribute: "name", key: "twitter:card" },
];

// Penanda pada meta description bahwa nilainya milik halaman, bukan identitas
// situs. SiteContentProvider memakai penanda ini agar tidak menimpa deskripsi
// halaman saat konten situs selesai dimuat.
const PAGE_SEO_MARKER = "data-page-seo";

function findMeta(attribute, key) {
  return document.head.querySelector(`meta[${attribute}="${key}"]`);
}

// Nilai awal dibaca sekali saat modul dimuat, yaitu isi index.html sebelum
// halaman mana pun berjalan. Dengan begitu unmount mengembalikan tag ke keadaan
// semula, bukan ke nilai halaman yang barusan ditinggalkan.
const INITIAL = (() => {
  if (typeof document === "undefined") return null;
  const canonical = document.head.querySelector('link[rel="canonical"]');
  return {
    title: document.title,
    meta: MANAGED_META.map(({ attribute, key }) => ({
      attribute,
      key,
      content: findMeta(attribute, key)?.getAttribute("content") ?? null,
    })),
    canonical: canonical?.getAttribute("href") ?? null,
  };
})();

function setMeta(attribute, key, content) {
  let element = findMeta(attribute, key);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
  return element;
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function restoreInitial() {
  if (!INITIAL) return;
  document.title = INITIAL.title;
  for (const { attribute, key, content } of INITIAL.meta) {
    const element = findMeta(attribute, key);
    element?.removeAttribute(PAGE_SEO_MARKER);
    if (content === null) {
      element?.remove();
      continue;
    }
    setMeta(attribute, key, content);
  }
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (INITIAL.canonical === null) {
    canonical?.remove();
  } else if (canonical) {
    canonical.setAttribute("href", INITIAL.canonical);
  }
}

// Judul tab, deskripsi, dan tautan kanonik per halaman. Menerima string
// (perilaku lama: hanya judul) atau objek `{ title, description, path }`.
// Deskripsi kosong memakai metaDescription situs, dan `path` diubah menjadi URL
// absolut memakai origin halaman yang sedang dibuka.
export function usePageTitle(options) {
  const { site } = useSiteContent();
  const config = typeof options === "string" ? { title: options } : options || {};
  const { title, description, path } = config;

  const fullTitle = title ? `${title} | ${site.name}` : site.metaTitle;
  const metaDescription = (description || "").trim() || site.metaDescription;
  const canonicalUrl = path ? new URL(path, window.location.origin).href : "";

  useEffect(() => {
    document.title = fullTitle;
    setMeta("name", "description", metaDescription).setAttribute(
      PAGE_SEO_MARKER,
      "true",
    );
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", metaDescription);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary_large_image");
    if (canonicalUrl) {
      setMeta("property", "og:url", canonicalUrl);
      setCanonical(canonicalUrl);
    }
  }, [fullTitle, metaDescription, canonicalUrl]);

  // Tag dikembalikan hanya saat halaman benar-benar unmount, bukan setiap kali
  // nilainya berubah, supaya tidak ada kedipan tag di tengah navigasi.
  useEffect(() => restoreInitial, []);
}
