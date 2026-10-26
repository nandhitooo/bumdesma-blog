import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";
import { DEFAULTS, getSiteIdentity } from "../services/siteContent.js";

// Router ini dipasang di ROOT (bukan /api) karena berkas SEO dan pratinjau
// tautan harus bisa diakses langsung di domain publik, mis. /sitemap.xml.
const router = express.Router();

const SITEMAP_LIMIT = 5000;
const FEED_LIMIT = 20;

// Halaman publik boleh dibaca banyak perayap sekaligus, tetapi tetap dibatasi
// supaya satu IP tidak bisa membebani database tanpa henti.
const seoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
  },
});

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const XML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

// Semua nilai yang berasal dari database atau env harus melewati salah satu
// fungsi ini sebelum masuk ke HTML/XML. Tanpa escape, judul artikel bisa
// menyisipkan tag atau menutup atribut.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

function siteUrl() {
  return env.publicSiteUrl;
}

function absoluteUrl(pathname) {
  return `${siteUrl()}${pathname}`;
}

// Slug artikel dan kategori memakai pola yang sama di seluruh proyek.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 220 &&
    SLUG_PATTERN.test(value)
  );
}

function isoDate(value) {
  return new Date(value).toISOString();
}

router.get("/robots.txt", seoLimiter, (req, res) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");

  return res.type("text/plain").send(body);
});

router.get("/sitemap.xml", seoLimiter, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT slug, updated_at
     FROM articles
     WHERE status = 'published' AND published_at <= now()
     ORDER BY updated_at DESC
     LIMIT $1`,
    [SITEMAP_LIMIT],
  );

  const urls = [
    { loc: absoluteUrl("/") },
    { loc: absoluteUrl("/blog") },
    ...rows.map((row) => ({
      loc: absoluteUrl(`/blog/${row.slug}`),
      lastmod: isoDate(row.updated_at),
    })),
  ];

  const entries = urls
    .map(({ loc, lastmod }) => {
      const lines = [`    <loc>${escapeXml(loc)}</loc>`];
      if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    })
    .join("\n");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");

  return res.type("application/xml").send(body);
});

router.get("/feed.xml", seoLimiter, async (req, res) => {
  // Judul dan deskripsi saluran ikut panel admin. Kegagalan membaca database
  // tidak boleh mematikan feed: pakai teks bawaan yang sama dengan API publik.
  const site = await getSiteIdentity().catch(() => DEFAULTS.site);

  // Artikel terbit selalu punya published_at, tetapi COALESCE menjaga data lama
  // yang belum sempat diisi tetap punya tanggal yang valid di feed.
  // Artikel yang masih terjadwal belum masuk feed: pembaca tidak boleh
  // menemukan tautan yang belum bisa dibuka.
  const { rows } = await pool.query(
    `SELECT title, slug, excerpt, COALESCE(published_at, created_at) AS published_at
     FROM articles
     WHERE status = 'published' AND published_at <= now()
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $1`,
    [FEED_LIMIT],
  );

  const items = rows
    .map((row) => {
      const link = absoluteUrl(`/blog/${row.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(row.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(new Date(row.published_at).toUTCString())}</pubDate>`,
        `      <description>${escapeXml(row.excerpt)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(site.feedTitle)}</title>`,
    `    <link>${escapeXml(siteUrl())}</link>`,
    `    <description>${escapeXml(site.feedDescription)}</description>`,
    "    <language>id</language>",
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return res.type("application/rss+xml").send(body);
});

router.get("/share/:slug", seoLimiter, async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");

  const { slug } = req.params;
  if (!isValidSlug(slug)) {
    return res
      .status(404)
      .type("html")
      .send(
        "<!doctype html><html lang=\"id\"><head><meta charset=\"utf-8\"><title>Artikel tidak ditemukan</title></head><body><p>Artikel tidak ditemukan.</p></body></html>",
      );
  }

  // Pratinjau tautan untuk artikel terjadwal harus 404 sampai jam terbitnya,
  // supaya judul dan ringkasannya tidak bocor lebih awal.
  const { rows } = await pool.query(
    `SELECT title, slug, excerpt, cover_image_url
     FROM articles
     WHERE slug = $1 AND status = 'published' AND published_at <= now()`,
    [slug],
  );
  const article = rows[0];
  if (!article) {
    return res
      .status(404)
      .type("html")
      .send(
        "<!doctype html><html lang=\"id\"><head><meta charset=\"utf-8\"><title>Artikel tidak ditemukan</title></head><body><p>Artikel tidak ditemukan.</p></body></html>",
      );
  }

  const canonical = absoluteUrl(`/blog/${article.slug}`);
  const title = escapeHtml(article.title);
  const description = escapeHtml(article.excerpt);
  const image = article.cover_image_url
    ? absoluteUrl(article.cover_image_url)
    : null;

  const meta = [
    '<meta name="description" content="' + description + '">',
    '<meta property="og:type" content="article">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    image
      ? `<meta property="og:image" content="${escapeHtml(image)}">`
      : "",
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const body = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    ${meta}
  </head>
  <body>
    <p><a href="${escapeHtml(canonical)}">${title}</a></p>
  </body>
</html>
`;

  return res.type("html").send(body);
});

export default router;
