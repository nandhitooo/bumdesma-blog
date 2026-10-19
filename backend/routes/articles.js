import express from "express";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { pool } from "../db/pool.js";
import { validate } from "../middleware/validate.js";
import {
  ARTICLE_DETAIL_COLUMNS,
  ARTICLE_LIST_COLUMNS,
  cleanContent,
  escapeLike,
  scopeToEditor,
} from "../services/articles.js";
import {
  deleteUnreferencedUploads,
  extractUploadUrls,
} from "../services/uploads.js";

// Dua router dipisah: publik (hanya baca artikel terbit) dan admin (CRUD).
// Sebelumnya keduanya berbagi satu router sehingga route daftar publik
// (`GET /`) menutup route daftar admin, dan filter `?status=` tidak pernah
// dijalankan. Struktur ini mengikuti pola yang sudah dipakai routes/categories.js.
const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const publicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().max(200).optional(),
});

// Daftar artikel admin dibatasi supaya satu request tidak pernah menarik seluruh
// tabel sekaligus; jumlah default (200) jauh di atas kebutuhan panel dan bentuk
// responsnya tetap sama.
const adminListQuerySchema = z.object({
  status: z.enum(["all", "draft", "published"]).default("all"),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

// Pratinjau tidak menyentuh database, tetapi sanitasi HTML tetap bisa dipanggil
// berkali-kali dalam satu artikel (penulis melihat hasil sambil mengetik).
// Limiter terpisah per pengguna, mengikuti pola routes/upload.js, supaya
// pratinjau tidak menghabiskan jatah writeLimiter bersama di app.js.
const previewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  message: {
    message: "Terlalu banyak pratinjau artikel. Coba lagi beberapa saat lagi.",
  },
});

const articleFields = {
  title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  excerpt: z.string().trim().max(1000).default(""),
  contentHtml: z.string().max(1_000_000).default(""),
  coverImageUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^\/uploads\/[0-9a-f-]+\.(?:jpg|png|webp)$/i, "URL gambar tidak valid.")
    .nullable()
    .optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
};

const createArticleSchema = z.object({
  ...articleFields,
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
const updateArticleSchema = z.object({
  ...articleFields,
  title: articleFields.title.optional(),
  slug: articleFields.slug.optional(),
  // excerpt dan contentHtml TIDAK boleh mewarisi `.default("")` dari
  // articleFields: di Zod 4, `.default("").optional()` tetap menghasilkan ""
  // untuk field yang tidak dikirim, sehingga PUT parsial (mis. hanya mengubah
  // judul) menghapus excerpt dan isi artikel — dan gambar inline-nya ikut
  // dibersihkan dari disk lewat deleteUnreferencedUploads. Karena itu aturan
  // keduanya ditulis ulang tanpa default.
  excerpt: z.string().trim().max(1000).optional(),
  contentHtml: z.string().max(1_000_000).optional(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
// Isi yang dipratinjau divalidasi dengan aturan yang sama seperti penyimpanan,
// supaya hasil pratinjau tidak bisa menerima masukan yang akan ditolak saat
// artikel benar-benar disimpan.
const previewSchema = z.object({
  contentHtml: articleFields.contentHtml,
});

const statusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

/* ---------------------------------------------------------------- publik ---- */

// Daftar artikel terbit dengan paginasi, filter kategori, dan pencarian.
publicRouter.get(
  "/",
  validate(publicQuerySchema, "query"),
  async (req, res) => {
    const { page, limit, category, q } = req.validated.query;
    const filters = ["a.status = 'published'"];
    const values = [];

    if (category) {
      values.push(category);
      filters.push(`c.slug = $${values.length}`);
    }
    if (q) {
      values.push(`%${escapeLike(q)}%`);
      filters.push(`(a.title ILIKE $${values.length} OR a.excerpt ILIKE $${values.length})`);
    }

    const where = filters.join(" AND ");
    const countResult = await pool.query(
      `SELECT count(*)::int AS total
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE ${where}`,
      values,
    );
    const offset = (page - 1) * limit;
    const articleResult = await pool.query(
      `SELECT ${ARTICLE_LIST_COLUMNS}
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.author_id
       WHERE ${where}
       ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    const total = countResult.rows[0].total;

    return res.json({
      articles: articleResult.rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  },
);

// Detail artikel terbit berdasarkan slug.
publicRouter.get("/:slug", async (req, res) => {
  const slug = z.string().trim().min(1).max(220).safeParse(req.params.slug);
  if (!slug.success) {
    return res.status(400).json({ message: "Slug artikel tidak valid." });
  }

  const { rows } = await pool.query(
    `SELECT ${ARTICLE_DETAIL_COLUMNS}
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.author_id
     WHERE a.slug = $1 AND a.status = 'published'`,
    [slug.data],
  );
  if (!rows[0]) {
    return res.status(404).json({ message: "Artikel tidak ditemukan." });
  }

  return res.json({ article: rows[0] });
});

/* ----------------------------------------------------------------- admin ---- */

// Router ini dipasang di /api/admin/articles, jadi requireAuth sudah dijalankan
// oleh `app.use("/api/admin", requireAuth)` sebelum sampai ke sini.
// Editor hanya boleh mengakses artikelnya sendiri (scopeToEditor).

// Daftar artikel untuk panel admin, dengan filter status.
adminRouter.get(
  "/",
  validate(adminListQuerySchema, "query"),
  async (req, res) => {
    const { status, limit } = req.validated.query;
    const values = [];
    const filters = [];

    if (status !== "all") {
      values.push(status);
      filters.push(`a.status = $${values.length}`);
    }
    scopeToEditor(filters, values, req.user);

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT ${ARTICLE_LIST_COLUMNS}, a.status, a.author_id AS "authorId"
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.author_id
       ${where}
       ORDER BY a.updated_at DESC
       LIMIT $${values.length + 1}`,
      [...values, limit],
    );
    return res.json({ articles: rows });
  },
);

// Pratinjau isi artikel: memakai sanitizer yang sama dengan penyimpanan, tetapi
// tidak pernah menulis ke database. Didaftarkan sebelum route "/:id" supaya
// kata "preview" tidak pernah ditafsirkan sebagai id artikel.
adminRouter.post(
  "/preview",
  previewLimiter,
  validate(previewSchema),
  (req, res) => {
    const { contentHtml } = req.validated.body;
    return res.json({ contentHtml: cleanContent(contentHtml) });
  },
);

// Detail artikel untuk editor (berdasarkan id, bukan slug).
adminRouter.get("/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params);
  if (!id.success) {
    return res.status(400).json({ message: "ID artikel tidak valid." });
  }

  const values = [id.data.id];
  const filters = ["a.id = $1"];
  scopeToEditor(filters, values, req.user);
  const { rows } = await pool.query(
    `SELECT ${ARTICLE_DETAIL_COLUMNS}, a.status, a.author_id AS "authorId"
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.author_id
     WHERE ${filters.join(" AND ")}`,
    values,
  );
  if (!rows[0]) {
    return res.status(404).json({ message: "Artikel tidak ditemukan." });
  }
  return res.json({ article: rows[0] });
});

adminRouter.post(
  "/",
  validate(createArticleSchema),
  async (req, res) => {
    const {
      title,
      slug,
      excerpt,
      contentHtml,
      coverImageUrl,
      categoryId,
      status = "draft",
      publishedAt,
    } = req.validated.body;
    if (req.user.role === "editor" && publishedAt !== undefined) {
      return res.status(403).json({ message: "Editor tidak dapat mengatur tanggal terbit." });
    }
    if (req.user.role === "editor" && status === "published") {
      return res.status(403).json({ message: "Editor tidak dapat menerbitkan artikel." });
    }
    const { rows } = await pool.query(
      `INSERT INTO articles
        (title, slug, excerpt, content_html, cover_image_url, category_id, author_id, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
         CASE WHEN $8 = 'published' THEN COALESCE($9::timestamptz, now()) ELSE NULL END)
       RETURNING id`,
      [
        title,
        slug,
        excerpt,
        cleanContent(contentHtml),
        coverImageUrl ?? null,
        categoryId ?? null,
        req.user.id,
        status,
        publishedAt ?? null,
      ],
    );
    return res.status(201).json({ id: rows[0].id });
  },
);

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateArticleSchema),
  async (req, res) => {
    const fields = req.validated.body;
    const assignments = [];
    const values = [];
    const columnNames = {
      title: "title",
      slug: "slug",
      excerpt: "excerpt",
      contentHtml: "content_html",
      coverImageUrl: "cover_image_url",
      categoryId: "category_id",
      status: "status",
    };

    for (const [field, value] of Object.entries(fields)) {
      // Tanggal terbit diurus query terpisah di bawah; jangan dianggap kolom.
      if (field === "publishedAt") continue;
      if (field === "contentHtml") {
        values.push(cleanContent(value));
      } else {
        values.push(field === "coverImageUrl" || field === "categoryId" ? value ?? null : value);
      }
      assignments.push(`${columnNames[field]} = $${values.length}`);
    }

    if (req.user.role === "editor" && fields.publishedAt !== undefined) {
      return res.status(403).json({ message: "Editor tidak dapat mengatur tanggal terbit." });
    }
    if (req.user.role === "editor" && fields.status === "published") {
      return res.status(403).json({ message: "Editor tidak dapat menerbitkan artikel." });
    }
    if (fields.status) {
      values.push(fields.status === "published");
      assignments.push(
        `published_at = CASE WHEN $${values.length} THEN COALESCE(published_at, now()) ELSE NULL END`,
      );
    }
    assignments.push("updated_at = now()");
    values.push(req.validated.params.id);
    const filters = [`id = $${values.length}`];
    scopeToEditor(filters, values, req.user, "author_id");

    // Nilai lama dibaca lebih dulu untuk mengetahui gambar mana yang mungkin
    // tidak lagi dirujuk setelah artikel ini diperbarui. Query ini memakai
    // daftar parameter sendiri: Postgres menolak parameter yang tidak dipakai
    // di statement yang sama (error 42P18).
    const previousValues = [req.validated.params.id];
    const previousFilters = ["id = $1"];
    scopeToEditor(previousFilters, previousValues, req.user, "author_id");
    const previous = await pool.query(
      `SELECT cover_image_url, content_html FROM articles
       WHERE ${previousFilters.join(" AND ")}`,
      previousValues,
    );

    const { rows } = await pool.query(
      `UPDATE articles SET ${assignments.join(", ")}
       WHERE ${filters.join(" AND ")}
       RETURNING id, content_html`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }

    // Tanggal terbit hanya berlaku untuk artikel terbit; dikirim terpisah agar
    // PUT parsial yang tidak menyertakannya tidak mengubah published_at.
    if (typeof fields.publishedAt === "string") {
      const publishedValues = [fields.publishedAt, req.validated.params.id];
      const publishedFilters = ["id = $2", "status = 'published'"];
      scopeToEditor(publishedFilters, publishedValues, req.user, "author_id");
      await pool.query(
        `UPDATE articles SET published_at = $1::timestamptz WHERE ${publishedFilters.join(" AND ")}`,
        publishedValues,
      );
    }

    const previousRow = previous.rows[0];
    const removedCoverImages =
      "coverImageUrl" in fields &&
      previousRow?.cover_image_url &&
      previousRow.cover_image_url !== fields.coverImageUrl
        ? [previousRow.cover_image_url]
        : [];

    const currentInlineImages = new Set(
      extractUploadUrls(rows[0].content_html),
    );
    const removedInlineImages = extractUploadUrls(
      previousRow?.content_html,
    ).filter((url) => !currentInlineImages.has(url));

    // Hanya berkas yang benar-benar sudah tidak dirujuk artikel mana pun yang
    // dihapus; kegagalan hapus hanya dicatat, bukan menggagalkan request.
    await deleteUnreferencedUploads([
      ...removedCoverImages,
      ...removedInlineImages,
    ]);

    return res.json({ id: rows[0].id });
  },
);

adminRouter.patch(
  "/:id/status",
  validate(idSchema, "params"),
  validate(statusSchema),
  async (req, res) => {
    const { status } = req.validated.body;
    if (req.user.role === "editor" && status === "published") {
      return res.status(403).json({ message: "Editor tidak dapat menerbitkan artikel." });
    }

    const values = [status === "published", req.validated.params.id];
    const filters = ["id = $2"];
    scopeToEditor(filters, values, req.user, "author_id");
    const { rows } = await pool.query(
      `UPDATE articles
       SET status = CASE WHEN $1 THEN 'published' ELSE 'draft' END,
           published_at = CASE WHEN $1 THEN COALESCE(published_at, now()) ELSE NULL END,
           updated_at = now()
       WHERE ${filters.join(" AND ")}
       RETURNING id`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    return res.json({ id: rows[0].id, status });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const values = [req.validated.params.id];
    const filters = ["id = $1"];
    scopeToEditor(filters, values, req.user, "author_id");
    const { rows } = await pool.query(
      `DELETE FROM articles WHERE ${filters.join(" AND ")}
       RETURNING cover_image_url, content_html`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }

    // Artikel sudah hilang, jadi gambarnya tidak mungkin dirujuk lagi.
    await deleteUnreferencedUploads([
      rows[0].cover_image_url,
      ...extractUploadUrls(rows[0].content_html),
    ]);

    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
