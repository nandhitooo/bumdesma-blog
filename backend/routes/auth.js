import express from "express";
import bcrypt from "bcrypt";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { BCRYPT_ROUNDS } from "../config/env.js";
import { pool } from "../db/pool.js";
import {
  AUTH_COOKIE,
  clearCookieOptions,
  cookieOptions,
  publicUser,
  requireAuth,
  signToken,
} from "../middleware/auth.js";
import { logAudit } from "../services/audit.js";
import { withPasswordByteLimit } from "../services/passwords.js";

const router = express.Router();

// Hash dummy dengan biaya bcrypt yang sama seperti user sungguhan. Dipakai saat
// email tidak ditemukan supaya waktu respons login tidak membocorkan apakah
// sebuah email terdaftar (account enumeration). Bukan kredensial siapa pun.
const DUMMY_PASSWORD_HASH =
  "$2b$12$uFlt5pL6uBGBZvr/S4MOUuA2pmd06UYB4Z1mDf9hisN9qRN1kk9bi";

const loginSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Format email tidak valid.")),
  password: withPasswordByteLimit(
    z.string({ error: "Password wajib diisi." }).min(1, "Password wajib diisi."),
  ),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Hanya percobaan gagal yang dihitung: login yang berhasil tidak menghabiskan
  // jatah, sehingga penggunaan normal tidak mengunci pengguna sendiri.
  skipSuccessfulRequests: true,
  message: {
    message: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.",
  },
});

const changePasswordSchema = z.object({
  currentPassword: withPasswordByteLimit(
    z
      .string({ error: "Password saat ini wajib diisi." })
      .min(1, "Password saat ini wajib diisi."),
  ),
  newPassword: withPasswordByteLimit(
    z
      .string({ error: "Password baru wajib diisi." })
      .min(8, "Password baru minimal 8 karakter."),
  ),
});

// Batas percobaan ganti password berlaku per pengguna, bukan per IP: beberapa
// pengelola bisa berbagi satu IP kantor. requireAuth dijalankan lebih dulu,
// sehingga req.user sudah tersedia saat limiter membaca kuncinya. Hanya
// percobaan gagal yang dihitung (skipSuccessfulRequests).
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  message: {
    message: "Terlalu banyak percobaan ganti password. Coba lagi beberapa menit lagi.",
  },
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { email, password } = parsed.data;
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email],
    );

    const user = rows[0];
    // Bandingkan tetap walau email tidak ada, dengan hash dummy: waktu respons
    // untuk email yang tidak terdaftar jadi kurang lebih sama.
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_PASSWORD_HASH,
    );

    if (!passwordMatches) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    res.cookie(AUTH_COOKIE, signToken(user), cookieOptions());
    // Login berhasil dicatat; percobaan gagal sengaja tidak dicatat. req.user
    // belum ada di sini, jadi id pengguna dikirim eksplisit.
    await logAudit(req, "login", "user", user.id, {}, user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE, clearCookieOptions());
  return res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Setiap pengguna yang sudah login boleh mengganti password-nya sendiri.
router.post(
  "/change-password",
  requireAuth,
  changePasswordLimiter,
  async (req, res, next) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { currentPassword, newPassword } = parsed.data;
      if (newPassword === currentPassword) {
        return res.status(400).json({
          message: "Password baru tidak boleh sama dengan password saat ini.",
        });
      }

      // Hash dibaca langsung dari database: req.user dari requireAuth sengaja
      // tidak memuat password_hash.
      const { rows } = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [req.user.id],
      );
      const user = rows[0];
      if (!user) {
        return res.status(401).json({ message: "Akun tidak ditemukan." });
      }

      const currentMatches = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );
      if (!currentMatches) {
        // Sengaja 400, bukan 401: frontend memperlakukan 401 sebagai sesi
        // kedaluwarsa dan mengalihkan pengguna ke halaman login. Password saat
        // ini yang salah bukan alasan untuk mengakhiri sesi.
        return res.status(400).json({ message: "Password saat ini salah." });
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await pool.query(
        "UPDATE users SET password_hash = $1, password_changed_at = now() WHERE id = $2",
        [passwordHash, req.user.id],
      );

      // Cookie baru diterbitkan agar browser ini tetap masuk, sementara sesi
      // lain yang lebih lama (iat sebelum password_changed_at) ditolak
      // requireAuth.
      res.cookie(AUTH_COOKIE, signToken(req.user), cookieOptions());
      await logAudit(req, "password-change", "user", req.user.id);
      return res.json({ message: "Password berhasil diubah." });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
