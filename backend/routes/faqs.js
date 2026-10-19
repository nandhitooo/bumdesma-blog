import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

// Router publik dan admin dipisah mengikuti pola routes/categories.js: daftar
// FAQ boleh dibaca siapa saja, sedangkan perubahan data hanya untuk admin.
const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const plainText = (schema, message) =>
  schema.refine((value) => !/[<>]/.test(value), message);

const questionSchema = plainText(
  z
    .string({ error: "Pertanyaan wajib diisi." })
    .trim()
    .min(1, "Pertanyaan wajib diisi.")
    .max(300, "Pertanyaan maksimal 300 karakter."),
  "Pertanyaan harus berupa teks biasa.",
);

// Jawaban boleh memuat baris baru (ditampilkan dengan whitespace-pre-line),
// tetapi tetap bukan HTML.
const answerSchema = plainText(
  z
    .string({ error: "Jawaban wajib diisi." })
    .trim()
    .min(1, "Jawaban wajib diisi.")
    .max(2000, "Jawaban maksimal 2000 karakter."),
  "Jawaban harus berupa teks biasa.",
);

const sortOrderSchema = z.coerce
  .number({ error: "Urutan wajib berupa angka." })
  .int("Urutan harus berupa bilangan bulat.")
  .min(0, "Urutan minimal 0.")
  .max(9999, "Urutan maksimal 9999.");

const createFaqSchema = z.object({
  question: questionSchema,
  answer: answerSchema,
  sortOrder: sortOrderSchema.default(0),
});

// Ubah sebagian: field yang tidak dikirim tidak boleh ikut di-reset, jadi
// sortOrder tidak mewarisi `.default()` dari skema tambah.
const updateFaqSchema = z.object({
  question: questionSchema.optional(),
  answer: answerSchema.optional(),
  sortOrder: sortOrderSchema.optional(),
});

const FAQ_COLUMNS = `
  id,
  question,
  answer,
  sort_order AS "sortOrder",
  created_at AS "createdAt"
`;

publicRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${FAQ_COLUMNS} FROM faqs ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ faqs: rows });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${FAQ_COLUMNS} FROM faqs ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ faqs: rows });
});

adminRouter.post("/", validate(createFaqSchema), async (req, res) => {
  const { question, answer, sortOrder } = req.validated.body;
  const { rows } = await pool.query(
    `INSERT INTO faqs (question, answer, sort_order)
     VALUES ($1, $2, $3)
     RETURNING ${FAQ_COLUMNS}`,
    [question, answer, sortOrder],
  );
  return res.status(201).json({ faq: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateFaqSchema),
  async (req, res) => {
    const fields = req.validated.body;
    const columnNames = {
      question: "question",
      answer: "answer",
      sortOrder: "sort_order",
    };

    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(fields)) {
      values.push(value);
      assignments.push(`${columnNames[field]} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan FAQ." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE faqs SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${FAQ_COLUMNS}`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "FAQ tidak ditemukan." });
    }
    return res.json({ faq: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rowCount } = await pool.query("DELETE FROM faqs WHERE id = $1", [
      req.validated.params.id,
    ]);
    if (!rowCount) {
      return res.status(404).json({ message: "FAQ tidak ditemukan." });
    }
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
