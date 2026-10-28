// Logika artikel yang dipakai bersama oleh router publik dan router admin,
// supaya daftar kolom, sanitasi konten, dan filter kepemilikan editor tidak
// ditulis ulang di beberapa tempat.
import sanitizeHtml from "sanitize-html";

// Kolom list dipakai oleh halaman publik dan panel admin; detail menambah isi.
export const ARTICLE_LIST_COLUMNS = `
  a.id, a.title, a.slug, a.excerpt,
  a.cover_image_url AS "coverImageUrl", a.category_id AS "categoryId",
  c.name AS "categoryName", c.slug AS "categorySlug",
  u.name AS "authorName", a.published_at AS "publishedAt",
  a.created_at AS "createdAt", a.updated_at AS "updatedAt"
`;

export const ARTICLE_DETAIL_COLUMNS = `
  ${ARTICLE_LIST_COLUMNS.trimEnd()},
  a.content_html AS "contentHtml"
`;

// Gambar hanya boleh berasal dari folder unggahan server sendiri. Ini mencegah
// gambar pelacak/pihak ketiga ikut termuat di halaman publik (juga membocorkan
// alamat IP pembaca ke domain luar) sekaligus menutup jalur eksfiltrasi lewat
// atribut src. Polanya sama dengan validasi coverImageUrl di routes/articles.js.
const UPLOADED_IMAGE_SRC = /^\/uploads\/(?:[a-z-]+\/)?[0-9a-fA-F-]+\.(?:jpg|png|webp)$/;

// Daftar font dan ukuran di bawah adalah cermin dari
// frontend/src/admin/editorFormats.js (FONT_FAMILIES dan FONT_SIZES). Sanitizer
// hanya mengizinkan nilai yang persis ada di daftar ini, jadi bila salah satu
// daftar di frontend diubah, ubah daftar ini pada saat yang sama.
const ALLOWED_FONT_FAMILIES = [
  "Poppins",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Verdana",
  "Courier New",
];
const ALLOWED_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Nama font boleh ditulis dengan tanda kutip ganda, kutip tunggal, atau tanpa
// kutip (browser dan Tiptap memakai bentuk yang berbeda-beda), tetapi isinya
// harus tetap sama persis dengan daftar di atas.
const FONT_FAMILY_NAMES = ALLOWED_FONT_FAMILIES.map(escapeRegExp).join("|");
const FONT_FAMILY_VALUE = new RegExp(
  `^(?:"(?:${FONT_FAMILY_NAMES})"|'(?:${FONT_FAMILY_NAMES})'|(?:${FONT_FAMILY_NAMES}))$`,
);
const FONT_SIZE_VALUE = new RegExp(`^(?:${ALLOWED_FONT_SIZES.join("|")})px$`);
const HEX_COLOR_VALUE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const TEXT_ALIGN_VALUE = /^(?:left|center|right|justify)$/;

// Hanya properti ini yang boleh muncul di atribut style. Properti lain
// (background, position, url(), expression(), var(), dan sebagainya) dibuang
// seluruhnya oleh sanitize-html karena tidak punya pola yang cocok.
const ALLOWED_STYLES = {
  "font-family": [FONT_FAMILY_VALUE],
  "font-size": [FONT_SIZE_VALUE],
  color: [HEX_COLOR_VALUE],
  "background-color": [HEX_COLOR_VALUE],
  "text-align": [TEXT_ALIGN_VALUE],
};

const sanitizeOptions = {
  allowedTags: [
    "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5",
    "h6", "hr", "img", "li", "mark", "ol", "p", "pre", "s", "span",
    "strong", "u", "ul",
  ],
  allowedAttributes: {
    // "name" dibuang: atribut itu bisa menumbuk elemen global di dalam halaman.
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    // Format teks dari editor disimpan sebagai inline style pada elemen ini.
    span: ["style"],
    mark: ["style"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    li: ["style"],
    blockquote: ["style"],
  },
  allowedStyles: { "*": ALLOWED_STYLES },
  // Skema yang diizinkan eksplisit, dan URL protokol-relatif ("//situs-luar")
  // ditolak agar tidak ada tautan ke luar yang menyamar sebagai tautan lokal.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  exclusiveFilter(frame) {
    if (frame.tag !== "img") return false;
    return !UPLOADED_IMAGE_SRC.test(frame.attribs.src || "");
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform(
      "a",
      { rel: "noopener noreferrer" },
      true,
    ),
  },
};

// Konten dari editor dipercaya sebagai HTML mentah, jadi harus dibersihkan dulu.
export function cleanContent(html) {
  return sanitizeHtml(html, sanitizeOptions);
}

// Escape wildcard LIKE supaya pencarian "50%" tidak jadi pola pencarian.
export function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Editor hanya boleh melihat/mengubah artikelnya sendiri. Filter ini menambah
// satu nilai ke `values` dan satu klausa ke `filters` (dipakai pemanggil dengan
// `filters.join(" AND ")`), sehingga posisi placeholder tetap konsisten.
export function scopeToEditor(filters, values, user, column = "a.author_id") {
  if (user.role !== "editor") return filters;
  values.push(user.id);
  filters.push(`${column} = $${values.length}`);
  return filters;
}
