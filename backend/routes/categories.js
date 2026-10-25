import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";

const publicRouter = express.Router();
const adminRouter = express.Router();
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug kategori wajib diisi.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
});
const updateCategorySchema = categorySchema.partial();

publicRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, slug FROM categories ORDER BY name ASC",
  );
  return res.json({ categories: rows });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, slug FROM categories ORDER BY name ASC",
  );
  return res.json({ categories: rows });
});

adminRouter.post("/", validate(categorySchema), async (req, res) => {
  const { name, slug } = req.validated.body;
  const { rows } = await pool.query(
    "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
    [name, slug],
  );
  await logAudit(req, "create", "category", rows[0].id);
  return res.status(201).json({ category: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateCategorySchema),
  async (req, res) => {
    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(req.validated.body)) {
      values.push(value);
      assignments.push(`${field} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan kategori." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE categories SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, name, slug`,
      values,
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Kategori tidak ditemukan." });
    }
    await logAudit(req, "update", "category", rows[0].id, {
      fields: Object.keys(req.validated.body),
    });
    return res.json({ category: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM categories WHERE id = $1",
      [req.validated.params.id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Kategori tidak ditemukan." });
    }
    await logAudit(req, "delete", "category", req.validated.params.id);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
