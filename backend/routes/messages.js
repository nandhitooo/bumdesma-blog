import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";

// Formulir kontak adalah satu-satunya endpoint tulis tanpa sesi, jadi router
// publik dan admin dipisah mengikuti pola routes/faqs.js. Router admin dipasang
// di bawah requireAuth milik /api/admin (lihat app.js).
const publicRouter = express.Router();
const adminRouter = express.Router();

// Nama field jebakan. Di formulir ia disembunyikan lewat CSS sehingga pengguna
// sungguhan tidak pernah mengisinya, sedangkan bot pengisi otomatis biasanya
// mengisi semua input yang ditemukan.
export const HONEYPOT_FIELD = "website";

// Lima pesan per 15 menit cukup untuk satu keluarga, tetapi memotong pengiriman
// massal dari satu IP. Dikunci dengan ipKeyGenerator supaya IPv6 tidak dihitung
// per alamat penuh (satu pengguna bisa punya banyak alamat).
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => `contact:${ipKeyGenerator(req.ip)}`,
  message: {
    message:
      "Terlalu banyak pesan dikirim dari jaringan ini. Coba lagi beberapa menit lagi.",
  },
});

const plainText = (schema, message) =>
  schema.refine((value) => !/[<>]/.test(value), message);

const nameSchema = plainText(
  z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(100, "Nama maksimal 100 karakter."),
  "Nama harus berupa teks biasa.",
);

const emailSchema = z
  .string({ error: "Email wajib diisi." })
  .trim()
  .min(1, "Email wajib diisi.")
  .max(150, "Email maksimal 150 karakter.")
  .toLowerCase()
  .pipe(z.email("Format email tidak valid."));

const phoneSchema = plainText(
  z.string().trim().max(30, "Nomor telepon maksimal 30 karakter."),
  "Nomor telepon harus berupa teks biasa.",
);

const messageSchema = plainText(
  z
    .string({ error: "Pesan wajib diisi." })
    .trim()
    .min(10, "Pesan minimal 10 karakter.")
    .max(2000, "Pesan maksimal 2000 karakter."),
  "Pesan harus berupa teks biasa.",
);

export const createMessageSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  // Nomor telepon boleh dikosongkan; yang dikosongkan disimpan sebagai NULL.
  phone: phoneSchema.optional(),
  message: messageSchema,
  // Nilainya tidak divalidasi ketat: apa pun isi jebakan ini, permintaan tetap
  // dianggap sukses supaya bot tidak belajar cara lolos.
  [HONEYPOT_FIELD]: z.unknown().optional(),
});

export function isHoneypotFilled(body) {
  const value = body?.[HONEYPOT_FIELD];
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  // Angka, array, atau objek di field jebakan juga bukan isian manusia.
  return true;
}

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const MESSAGE_COLUMNS = `
  id,
  name,
  email,
  phone,
  message,
  is_read AS "isRead",
  created_at AS "createdAt"
`;

// Jebakan diperiksa sebelum validasi field lain: bot yang mengisi semuanya
// dengan sampah tetap menerima balasan sukses, tetapi tidak ada yang disimpan.
function rejectHoneypot(req, res, next) {
  if (!isHoneypotFilled(req.body)) return next();
  return res.status(201).json({
    message: "Pesan Anda sudah kami terima.",
  });
}

publicRouter.post(
  "/",
  messageLimiter,
  rejectHoneypot,
  validate(createMessageSchema),
  async (req, res) => {
    const { name, email, phone, message } = req.validated.body;
    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, phone?.trim() ? phone.trim() : null, message],
    );

    return res.status(201).json({
      message:
        "Pesan Anda sudah kami terima. Kami akan menghubungi lewat email atau telepon yang dicantumkan.",
    });
  },
);

adminRouter.get("/", validate(listQuerySchema, "query"), async (req, res) => {
  const { page, limit } = req.validated.query;
  const offset = (page - 1) * limit;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT ${MESSAGE_COLUMNS} FROM contact_messages
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    pool.query("SELECT count(*)::int AS total FROM contact_messages"),
  ]);

  const total = countRows[0].total;
  return res.json({
    messages: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

// Tandai dibaca bersifat idempoten: memanggilnya dua kali tetap 200.
adminRouter.patch(
  "/:id/read",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE contact_messages SET is_read = true
       WHERE id = $1
       RETURNING ${MESSAGE_COLUMNS}`,
      [req.validated.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Pesan tidak ditemukan." });
    }
    return res.json({ contactMessage: rows[0] });
  },
);

adminRouter.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM contact_messages WHERE id = $1",
      [req.validated.params.id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Pesan tidak ditemukan." });
    }
    // Audit hanya mencatat id dan aksi; isi pesan tidak pernah dicatat.
    await logAudit(req, "delete", "contact_message", req.validated.params.id);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
