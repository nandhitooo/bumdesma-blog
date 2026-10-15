import express from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
const idSchema = z.object({ id: z.coerce.number().int().positive() });

const publicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().max(200).optional(),
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
});
const updateArticleSchema = z.object({
  ...articleFields,
  title: articleFields.title.optional(),
  slug: articleFields.slug.optional(),
  excerpt: articleFields.excerpt.optional(),
  contentHtml: articleFields.contentHtml.optional(),
  status: z.enum(["draft", "published"]).optional(),
});
const statusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

const articleListColumns = `
  a.id, a.title, a.slug, a.excerpt,
  a.cover_image_url AS "coverImageUrl", a.category_id AS "categoryId",
  c.name AS "categoryName", c.slug AS "categorySlug",
  u.name AS "authorName", a.published_at AS "publishedAt",
  a.created_at AS "createdAt", a.updated_at AS "updatedAt"
`;

const articleDetailColumns = `
  ${articleListColumns.trimEnd()},
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

function cleanContent(html) {
  return sanitizeHtml(html, sanitizeOptions);
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

router.get(
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
      `SELECT ${articleListColumns}
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

router.get("/:slug", async (req, res) => {
  if (req.baseUrl === "/api/admin/articles") {
    const id = idSchema.safeParse(req.params.slug);
    if (!id.success) {
      return res.status(400).json({ message: "ID artikel tidak valid." });
    }

    const values = [id.data.id];
    let where = "a.id = $1";
    if (req.user.role === "editor") {
      values.push(req.user.id);
      where += " AND a.author_id = $2";
    }
    const { rows } = await pool.query(
      `SELECT ${articleDetailColumns}, a.status, a.author_id AS "authorId"
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.author_id
       WHERE ${where}`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    return res.json({ article: rows[0] });
  }

  const slug = z.string().trim().min(1).max(220).safeParse(req.params.slug);
  if (!slug.success) {
    return res.status(400).json({ message: "Slug artikel tidak valid." });
  }

  const { rows } = await pool.query(
    `SELECT ${articleDetailColumns}
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

router.get(
  "/",
  validate(
    z.object({
      status: z.enum(["all", "draft", "published"]).default("all"),
    }),
    "query",
  ),
  async (req, res) => {
    const { status } = req.validated.query;
    const values = [];
    const filters = [];

    if (status !== "all") {
      values.push(status);
      filters.push(`a.status = $${values.length}`);
    }
    if (req.user.role === "editor") {
      values.push(req.user.id);
      filters.push(`a.author_id = $${values.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT ${articleListColumns}, a.status, a.author_id AS "authorId"
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.author_id
       ${where}
       ORDER BY a.updated_at DESC`,
      values,
    );
    return res.json({ articles: rows });
  },
);

router.post(
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
    } = req.validated.body;
    if (req.user.role === "editor" && status === "published") {
      return res.status(403).json({ message: "Editor tidak dapat menerbitkan artikel." });
    }
    const { rows } = await pool.query(
      `INSERT INTO articles
        (title, slug, excerpt, content_html, cover_image_url, category_id, author_id, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
         CASE WHEN $8 = 'published' THEN now() ELSE NULL END)
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
      ],
    );
    return res.status(201).json({ id: rows[0].id });
  },
);

router.put(
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
      if (field === "contentHtml") {
        values.push(cleanContent(value));
      } else {
        values.push(field === "coverImageUrl" || field === "categoryId" ? value ?? null : value);
      }
      assignments.push(`${columnNames[field]} = $${values.length}`);
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
    let where = `id = $${values.length}`;
    if (req.user.role === "editor") {
      values.push(req.user.id);
      where += ` AND author_id = $${values.length}`;
    }

    const { rows } = await pool.query(
      `UPDATE articles SET ${assignments.join(", ")}
       WHERE ${where}
       RETURNING id`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    return res.json({ id: rows[0].id });
  },
);

router.patch(
  "/:id/status",
  validate(idSchema, "params"),
  validate(statusSchema),
  async (req, res) => {
    const { status } = req.validated.body;
    if (req.user.role === "editor" && status === "published") {
      return res.status(403).json({ message: "Editor tidak dapat menerbitkan artikel." });
    }

    const values = [status === "published", req.validated.params.id];
    let where = "id = $2";
    if (req.user.role === "editor") {
      values.push(req.user.id);
      where += " AND author_id = $3";
    }
    const { rows } = await pool.query(
      `UPDATE articles
       SET status = CASE WHEN $1 THEN 'published' ELSE 'draft' END,
           published_at = CASE WHEN $1 THEN COALESCE(published_at, now()) ELSE NULL END,
           updated_at = now()
       WHERE ${where}
       RETURNING id`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    return res.json({ id: rows[0].id, status });
  },
);

router.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const values = [req.validated.params.id];
    let where = "id = $1";
    if (req.user.role === "editor") {
      values.push(req.user.id);
      where += " AND author_id = $2";
    }
    const { rowCount } = await pool.query(
      `DELETE FROM articles WHERE ${where}`,
      values,
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    return res.status(204).end();
  },
);

export default router;
