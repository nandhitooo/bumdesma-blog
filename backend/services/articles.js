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

const sanitizeOptions = {
  allowedTags: [
    "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5",
    "h6", "hr", "img", "li", "ol", "p", "pre", "s", "strong", "u", "ul",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
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
