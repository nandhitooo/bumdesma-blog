import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";

const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const titleSchema = z
  .string({ error: "Judul dokumen wajib diisi." })
  .trim()
  .min(1, "Judul dokumen wajib diisi.")
  .max(200, "Judul maksimal 200 karakter.")
  .refine((value) => !/[<>]/.test(value), "Judul harus berupa teks biasa.");

const yearSchema = z.coerce
  .number({ error: "Tahun wajib diisi." })
  .int("Tahun harus berupa bilangan bulat.")
  .min(2000, "Tahun minimal 2000.")
  .max(2100, "Tahun maksimal 2100.");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Deskripsi maksimal 500 karakter.")
  .refine((value) => !/[<>]/.test(value), "Deskripsi harus berupa teks biasa.");

// Sama seperti httpsUrl di services/siteContent.js: hanya tautan HTTPS yang
// diterima karena dokumen disimpan di penyimpanan eksternal (mis. Google Drive).
const urlSchema = z
  .string({ error: "URL dokumen wajib diisi." })
  .trim()
  .min(1, "URL dokumen wajib diisi.")
  .max(2048, "URL maksimal 2048 karakter.")
  .url("URL tidak valid.")
  .refine(
    (value) => /^https:\/\//i.test(value),
    "URL harus menggunakan HTTPS.",
  );

const documentSchema = z.object({
  title: titleSchema,
  year: yearSchema,
  description: descriptionSchema.default(""),
  url: urlSchema,
});

// Ubah sebagian: field yang tidak dikirim tidak boleh ikut di-reset, jadi
// description tidak memakai default di sini.
const updateDocumentSchema = z.object({
  title: titleSchema.optional(),
  year: yearSchema.optional(),
  description: descriptionSchema.optional(),
  url: urlSchema.optional(),
});

const SELECT_COLUMNS = "id, title, year, description, url, created_at";

publicRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM report_documents ORDER BY year DESC, id DESC`,
  );
  return res.json({ documents: rows });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM report_documents ORDER BY year DESC, id DESC`,
  );
  return res.json({ documents: rows });
});

adminRouter.post("/", validate(documentSchema), async (req, res) => {
  const { title, year, description, url } = req.validated.body;
  const { rows } = await pool.query(
    `INSERT INTO report_documents (title, year, description, url)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SELECT_COLUMNS}`,
    [title, year, description, url],
  );
  await logAudit(req, "create", "document", rows[0].id);
  return res.status(201).json({ document: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateDocumentSchema),
  async (req, res) => {
    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(req.validated.body)) {
      values.push(value);
      assignments.push(`${field} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan dokumen." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE report_documents SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${SELECT_COLUMNS}`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan." });
    }
    // Hanya nama field yang dicatat, bukan nilainya.
    await logAudit(req, "update", "document", rows[0].id, {
      fields: Object.keys(req.validated.body),
    });
    return res.json({ document: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM report_documents WHERE id = $1",
      [req.validated.params.id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan." });
    }
    await logAudit(req, "delete", "document", req.validated.params.id);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
