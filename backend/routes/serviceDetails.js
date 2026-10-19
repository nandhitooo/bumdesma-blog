import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

// Router publik dan admin dipisah mengikuti pola routes/categories.js: daftar
// layanan boleh dibaca siapa saja, sedangkan perubahan data hanya untuk admin.
const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const plainText = (schema, message) =>
  schema.refine((value) => !/[<>]/.test(value), message);

const slugSchema = z
  .string({ error: "Slug wajib diisi." })
  .trim()
  .min(1, "Slug wajib diisi.")
  .max(120, "Slug maksimal 120 karakter.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
  );

const titleSchema = plainText(
  z
    .string({ error: "Judul wajib diisi." })
    .trim()
    .min(1, "Judul wajib diisi.")
    .max(150, "Judul maksimal 150 karakter."),
  "Judul harus berupa teks biasa.",
);

const summarySchema = plainText(
  z.string().trim().max(600, "Ringkasan maksimal 600 karakter."),
  "Ringkasan harus berupa teks biasa.",
);

// Butir syarat/alur berupa teks biasa; React yang meng-escape saat dirender,
// jadi tidak ada HTML yang boleh masuk ke sini.
const listItemSchema = plainText(
  z
    .string({ error: "Butir tidak boleh kosong." })
    .trim()
    .min(1, "Butir tidak boleh kosong.")
    .max(300, "Setiap butir maksimal 300 karakter."),
  "Butir harus berupa teks biasa.",
);

const listSchema = z
  .array(listItemSchema)
  .max(20, "Maksimal 20 butir.");

const sortOrderSchema = z.coerce
  .number({ error: "Urutan wajib berupa angka." })
  .int("Urutan harus berupa bilangan bulat.");

const createServiceSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  summary: summarySchema.default(""),
  requirements: listSchema.default([]),
  steps: listSchema.default([]),
  sortOrder: sortOrderSchema.default(0),
});

// Ubah sebagian: field yang tidak dikirim tidak boleh ikut di-reset, jadi
// summary/requirements/steps/sortOrder tidak mewarisi `.default()` di sini.
const updateServiceSchema = z.object({
  slug: slugSchema.optional(),
  title: titleSchema.optional(),
  summary: summarySchema.optional(),
  requirements: listSchema.optional(),
  steps: listSchema.optional(),
  sortOrder: sortOrderSchema.optional(),
});

const SERVICE_COLUMNS = `
  id,
  slug,
  title,
  summary,
  requirements,
  steps,
  sort_order AS "sortOrder",
  created_at AS "createdAt"
`;

publicRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SERVICE_COLUMNS}
     FROM service_details
     ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ services: rows });
});

publicRouter.get("/:slug", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SERVICE_COLUMNS} FROM service_details WHERE slug = $1`,
    [req.params.slug],
  );
  if (!rows[0]) {
    return res.status(404).json({ message: "Layanan tidak ditemukan." });
  }
  return res.json({ service: rows[0] });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SERVICE_COLUMNS}
     FROM service_details
     ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ services: rows });
});

adminRouter.post("/", validate(createServiceSchema), async (req, res) => {
  const { slug, title, summary, requirements, steps, sortOrder } =
    req.validated.body;
  const { rows } = await pool.query(
    `INSERT INTO service_details (slug, title, summary, requirements, steps, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SERVICE_COLUMNS}`,
    [slug, title, summary, JSON.stringify(requirements), JSON.stringify(steps), sortOrder],
  );
  return res.status(201).json({ service: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateServiceSchema),
  async (req, res) => {
    const fields = req.validated.body;
    const columnNames = {
      slug: "slug",
      title: "title",
      summary: "summary",
      requirements: "requirements",
      steps: "steps",
      sortOrder: "sort_order",
    };

    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(fields)) {
      values.push(
        field === "requirements" || field === "steps"
          ? JSON.stringify(value)
          : value,
      );
      assignments.push(`${columnNames[field]} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan layanan." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE service_details SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${SERVICE_COLUMNS}`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Layanan tidak ditemukan." });
    }
    return res.json({ service: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM service_details WHERE id = $1",
      [req.validated.params.id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Layanan tidak ditemukan." });
    }
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
