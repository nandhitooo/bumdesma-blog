import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";
import { deleteUnreferencedUploads } from "../services/uploads.js";

// Router publik dan admin dipisah mengikuti pola routes/categories.js: daftar
// galeri boleh dibaca siapa saja, sedangkan perubahan data hanya untuk admin.
const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const publicQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
});

// Pola yang sama dengan coverImageUrl artikel: hanya berkas yang diunggah server
// sendiri yang boleh dipakai sebagai gambar galeri.
const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Gambar wajib dipilih.")
  .max(500)
  .regex(/^\/uploads\/[0-9a-f-]+\.(?:jpg|png|webp)$/i, "URL gambar tidak valid.");

const createGallerySchema = z.object({
  imageUrl: imageUrlSchema,
  caption: z.string().trim().max(200, "Keterangan maksimal 200 karakter.").default(""),
  eventDate: z.iso.date().nullable().optional(),
});

const updateGallerySchema = z.object({
  imageUrl: imageUrlSchema.optional(),
  caption: z.string().trim().max(200, "Keterangan maksimal 200 karakter.").optional(),
  eventDate: z.iso.date().nullable().optional(),
});

// Tanggal dikembalikan sebagai teks YYYY-MM-DD agar tidak bergeser satu hari
// saat driver mengubah kolom date menjadi objek Date.
const GALLERY_COLUMNS = `
  id,
  image_url AS "imageUrl",
  caption,
  event_date::text AS "eventDate",
  sort_order AS "sortOrder",
  created_at AS "createdAt"
`;

publicRouter.get(
  "/",
  validate(publicQuerySchema, "query"),
  async (req, res) => {
    const { limit } = req.validated.query;
    const { rows } = await pool.query(
      `SELECT ${GALLERY_COLUMNS}
       FROM gallery_items
       ORDER BY event_date DESC NULLS LAST, id DESC
       LIMIT $1`,
      [limit],
    );
    return res.json({ items: rows });
  },
);

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${GALLERY_COLUMNS}
     FROM gallery_items
     ORDER BY event_date DESC NULLS LAST, id DESC`,
  );
  return res.json({ items: rows });
});

adminRouter.post("/", validate(createGallerySchema), async (req, res) => {
  const { imageUrl, caption, eventDate } = req.validated.body;
  const { rows } = await pool.query(
    `INSERT INTO gallery_items (image_url, caption, event_date)
     VALUES ($1, $2, $3)
     RETURNING ${GALLERY_COLUMNS}`,
    [imageUrl, caption, eventDate ?? null],
  );
  await logAudit(req, "create", "gallery", rows[0].id);
  return res.status(201).json({ item: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateGallerySchema),
  async (req, res) => {
    const fields = req.validated.body;
    const columnNames = {
      imageUrl: "image_url",
      caption: "caption",
      eventDate: "event_date",
    };

    const previous = await pool.query(
      "SELECT image_url FROM gallery_items WHERE id = $1",
      [req.validated.params.id],
    );
    if (!previous.rows[0]) {
      return res.status(404).json({ message: "Item galeri tidak ditemukan." });
    }

    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(fields)) {
      values.push(field === "eventDate" ? value ?? null : value);
      assignments.push(`${columnNames[field]} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan galeri." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE gallery_items SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${GALLERY_COLUMNS}`,
      values,
    );

    // Hanya nama field yang dicatat, bukan nilainya.
    await logAudit(req, "update", "gallery", rows[0].id, {
      fields: Object.keys(fields),
    });

    // Gambar lama hanya boleh dihapus bila sudah tidak dirujuk artikel atau
    // item galeri lain; deleteUnreferencedUploads yang memutuskannya.
    if (fields.imageUrl && fields.imageUrl !== previous.rows[0].image_url) {
      await deleteUnreferencedUploads([previous.rows[0].image_url]);
    }

    return res.json({ item: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rows } = await pool.query(
      "DELETE FROM gallery_items WHERE id = $1 RETURNING image_url",
      [req.validated.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Item galeri tidak ditemukan." });
    }

    await logAudit(req, "delete", "gallery", req.validated.params.id);
    await deleteUnreferencedUploads([rows[0].image_url]);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
