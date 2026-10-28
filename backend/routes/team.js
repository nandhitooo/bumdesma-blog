import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";
import { deleteUnreferencedUploads } from "../services/uploads.js";

// Router publik dan admin dipisah mengikuti pola routes/categories.js: susunan
// pengurus boleh dibaca siapa saja, sedangkan perubahan data hanya untuk admin.
const publicRouter = express.Router();
const adminRouter = express.Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const plainText = (schema, message) =>
  schema.refine((value) => !/[<>]/.test(value), message);

const nameSchema = plainText(
  z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(150, "Nama maksimal 150 karakter."),
  "Nama harus berupa teks biasa.",
);

const positionSchema = plainText(
  z
    .string({ error: "Jabatan wajib diisi." })
    .trim()
    .min(1, "Jabatan wajib diisi.")
    .max(150, "Jabatan maksimal 150 karakter."),
  "Jabatan harus berupa teks biasa.",
);

const termLabelSchema = plainText(
  z.string().trim().max(50, "Masa bakti maksimal 50 karakter."),
  "Masa bakti harus berupa teks biasa.",
);

const sortOrderSchema = z.coerce
  .number({ error: "Urutan wajib berupa angka." })
  .int("Urutan harus berupa bilangan bulat.")
  .min(0, "Urutan minimal 0.")
  .max(9999, "Urutan maksimal 9999.");

// Pola yang sama dengan coverImageUrl artikel: hanya berkas yang diunggah server
// sendiri yang boleh dipakai sebagai foto pengurus. Tidak wajib diisi.
const photoUrlSchema = z
  .string()
  .trim()
  .max(500)
  .regex(/^\/uploads\/(?:[a-z-]+\/)?[0-9a-f-]+\.(?:jpg|png|webp)$/i, "URL gambar tidak valid.")
  .nullable()
  .optional();

const createTeamSchema = z.object({
  name: nameSchema,
  position: positionSchema,
  termLabel: termLabelSchema.default(""),
  photoUrl: photoUrlSchema,
  sortOrder: sortOrderSchema.default(0),
});

// Ubah sebagian: field yang tidak dikirim tidak boleh ikut di-reset, jadi
// termLabel dan sortOrder tidak mewarisi `.default()` dari skema tambah.
const updateTeamSchema = z.object({
  name: nameSchema.optional(),
  position: positionSchema.optional(),
  termLabel: termLabelSchema.optional(),
  photoUrl: photoUrlSchema,
  sortOrder: sortOrderSchema.optional(),
});

const TEAM_COLUMNS = `
  id,
  name,
  position,
  term_label AS "termLabel",
  photo_url AS "photoUrl",
  sort_order AS "sortOrder",
  created_at AS "createdAt"
`;

publicRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${TEAM_COLUMNS}
     FROM team_members
     ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ members: rows });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${TEAM_COLUMNS}
     FROM team_members
     ORDER BY sort_order ASC, id ASC`,
  );
  return res.json({ members: rows });
});

adminRouter.post("/", validate(createTeamSchema), async (req, res) => {
  const { name, position, termLabel, photoUrl, sortOrder } = req.validated.body;
  const { rows } = await pool.query(
    `INSERT INTO team_members (name, position, term_label, photo_url, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${TEAM_COLUMNS}`,
    [name, position, termLabel, photoUrl ?? null, sortOrder],
  );
  await logAudit(req, "create", "team", rows[0].id);
  return res.status(201).json({ member: rows[0] });
});

adminRouter.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateTeamSchema),
  async (req, res) => {
    const fields = req.validated.body;
    const columnNames = {
      name: "name",
      position: "position",
      termLabel: "term_label",
      photoUrl: "photo_url",
      sortOrder: "sort_order",
    };

    const previous = await pool.query(
      "SELECT photo_url FROM team_members WHERE id = $1",
      [req.validated.params.id],
    );
    if (!previous.rows[0]) {
      return res.status(404).json({ message: "Pengurus tidak ditemukan." });
    }

    const values = [];
    const assignments = [];
    for (const [field, value] of Object.entries(fields)) {
      values.push(field === "photoUrl" ? value ?? null : value);
      assignments.push(`${columnNames[field]} = $${values.length}`);
    }
    if (!assignments.length) {
      return res.status(400).json({ message: "Tidak ada perubahan pengurus." });
    }

    values.push(req.validated.params.id);
    const { rows } = await pool.query(
      `UPDATE team_members SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${TEAM_COLUMNS}`,
      values,
    );

    // Hanya nama field yang dicatat, bukan nilainya.
    await logAudit(req, "update", "team", rows[0].id, {
      fields: Object.keys(fields),
    });

    // Foto lama hanya boleh dihapus bila sudah tidak dirujuk artikel, item
    // galeri, atau pengurus lain; deleteUnreferencedUploads yang memutuskannya.
    if ("photoUrl" in fields && previous.rows[0].photo_url !== fields.photoUrl) {
      await deleteUnreferencedUploads([previous.rows[0].photo_url]);
    }

    return res.json({ member: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rows } = await pool.query(
      "DELETE FROM team_members WHERE id = $1 RETURNING photo_url",
      [req.validated.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Pengurus tidak ditemukan." });
    }

    await logAudit(req, "delete", "team", req.validated.params.id);
    await deleteUnreferencedUploads([rows[0].photo_url]);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
