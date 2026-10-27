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
import {
  buildOtpauthUrl,
  decryptSecret,
  encryptSecret,
  generateSecret,
  verifyCode,
} from "../services/totp.js";

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
  // Kode TOTP tidak divalidasi bentuknya di sini: kode yang salah (termasuk
  // bukan 6 digit) harus dijawab 401 dari alur verifikasi, bukan 400 validasi.
  code: z.string().optional(),
});

const totpCodeSchema = z.object({
  code: z
    .string({ error: "Kode verifikasi wajib diisi." })
    .trim()
    .min(1, "Kode verifikasi wajib diisi."),
});

const disableTotpSchema = z.object({
  password: withPasswordByteLimit(
    z.string({ error: "Password wajib diisi." }).min(1, "Password wajib diisi."),
  ),
  code: z
    .string({ error: "Kode verifikasi wajib diisi." })
    .trim()
    .min(1, "Kode verifikasi wajib diisi."),
});

// bigint dari Postgres dikembalikan pg sebagai string; otplib membutuhkan
// number untuk afterTimeStep. Nilai kosong berarti belum ada langkah tersimpan.
function toTimeStep(value) {
  if (value === null || value === undefined) return null;
  const step = Number(value);
  return Number.isSafeInteger(step) ? step : null;
}

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

// Limiter kedua yang dikunci pada akun, bukan IP: satu email hanya boleh salah
// password 10 kali per 15 menit walau penyerang berganti-ganti IP. Kuncinya
// email yang sudah dinormalisasi seperti di loginSchema; permintaan tanpa email
// jatuh kembali ke IP supaya tetap ada batasnya.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    return email
      ? `login-email:${email}`
      : `login-ip:${ipKeyGenerator(req.ip)}`;
  },
  // Sama seperti limiter per IP: login yang berhasil tidak menghabiskan jatah.
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

router.post("/login", loginLimiter, loginAccountLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { email, password, code } = parsed.data;
    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role, created_at,
              totp_enabled, totp_secret, totp_last_step
       FROM users WHERE email = $1`,
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
      // Percobaan gagal hanya dicatat bila akunnya ada: mencatat email yang tidak
      // terdaftar sama saja membuat audit log bisa dipakai menebak email mana
      // yang punya akun.
      if (user) {
        await logAudit(req, "login-failed", "user", user.id, {});
      }
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // Pengguna dengan 2FA belum mendapat cookie sebelum kode diverifikasi.
    // Respons pertama (tanpa code) hanya memberi tahu frontend agar menampilkan
    // kolom kode; limiter login tetap menghitung percobaan kode yang salah
    // karena respons 401 tidak di-skip.
    if (user.totp_enabled) {
      if (!code) {
        return res.json({ requiresTotp: true });
      }

      const { ok, step } = await verifyCode(
        decryptSecret(user.totp_secret),
        code,
        { afterStep: toTimeStep(user.totp_last_step) },
      );
      if (!ok) {
        await logAudit(req, "login-failed", "user", user.id, {});
        return res.status(401).json({ message: "Kode verifikasi salah." });
      }

      // Satu UPDATE atomik yang sekaligus mengklaim langkah kode: dua permintaan
      // bersamaan dengan kode yang sama hanya boleh lolos satu. Baris yang tidak
      // kembali berarti langkah itu sudah dipakai (kode dipakai ulang), jadi
      // cookie tidak diterbitkan.
      const claimed = await pool.query(
        `UPDATE users SET totp_last_step = $1
         WHERE id = $2 AND (totp_last_step IS NULL OR totp_last_step < $1)
         RETURNING id`,
        [step, user.id],
      );
      if (!claimed.rowCount) {
        await logAudit(req, "login-failed", "user", user.id, {});
        return res.status(401).json({ message: "Kode verifikasi salah." });
      }
    }

    res.cookie(AUTH_COOKIE, signToken(user), cookieOptions());
    // Login berhasil dicatat. Percobaan gagal hanya dicatat bila akun dengan
    // email tersebut memang ada (lihat di atas). req.user belum ada di sini,
    // jadi id pengguna dikirim eksplisit.
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

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    // requireAuth tidak memuat kolom TOTP, jadi statusnya dibaca di sini.
    // publicUser sengaja tidak pernah memuat totp_secret.
    const { rows } = await pool.query(
      "SELECT totp_enabled FROM users WHERE id = $1",
      [req.user.id],
    );
    return res.json({
      user: {
        ...publicUser(req.user),
        totpEnabled: Boolean(rows[0]?.totp_enabled),
      },
    });
  } catch (error) {
    return next(error);
  }
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

/* ------------------------------------------------------------------ 2FA --- */

// Mulai pengaturan 2FA: secret baru dibuat dan disimpan terenkripsi, tetapi
// totp_enabled tetap false sampai pengguna membuktikan aplikasi authenticator
// sudah menerima secret tersebut lewat /2fa/enable.
router.post(
  "/2fa/setup",
  requireAuth,
  changePasswordLimiter,
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        "SELECT totp_enabled FROM users WHERE id = $1",
        [req.user.id],
      );
      if (!rows[0]) {
        return res.status(401).json({ message: "Akun tidak ditemukan." });
      }
      if (rows[0].totp_enabled) {
        return res.status(400).json({
          message: "Verifikasi dua langkah sudah aktif.",
        });
      }

      const secret = generateSecret();
      // Setup ulang sebelum diaktifkan mengganti secret lama dan mengosongkan
      // langkah terakhir, supaya secret yang batal dipakai tidak tertinggal.
      await pool.query(
        `UPDATE users
         SET totp_secret = $1, totp_enabled = false, totp_last_step = NULL
         WHERE id = $2`,
        [encryptSecret(secret), req.user.id],
      );
      await logAudit(req, "totp-setup", "user", req.user.id);

      return res.json({
        secret,
        otpauthUrl: buildOtpauthUrl(req.user.email, secret),
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/2fa/enable",
  requireAuth,
  changePasswordLimiter,
  async (req, res, next) => {
    try {
      const parsed = totpCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { rows } = await pool.query(
        "SELECT totp_enabled, totp_secret FROM users WHERE id = $1",
        [req.user.id],
      );
      const user = rows[0];
      if (!user) {
        return res.status(401).json({ message: "Akun tidak ditemukan." });
      }
      if (user.totp_enabled) {
        return res.status(400).json({
          message: "Verifikasi dua langkah sudah aktif.",
        });
      }
      if (!user.totp_secret) {
        return res.status(400).json({
          message: "Mulai pengaturan verifikasi dua langkah terlebih dahulu.",
        });
      }

      const { ok, step } = await verifyCode(
        decryptSecret(user.totp_secret),
        parsed.data.code,
      );
      if (!ok) {
        return res.status(400).json({ message: "Kode verifikasi salah." });
      }

      await pool.query(
        "UPDATE users SET totp_enabled = true, totp_last_step = $1 WHERE id = $2",
        [step, req.user.id],
      );
      await logAudit(req, "totp-enable", "user", req.user.id);

      return res.json({
        message: "Verifikasi dua langkah berhasil diaktifkan.",
        totpEnabled: true,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// Kegagalan password atau kode sengaja 400, bukan 401: frontend memperlakukan
// 401 sebagai sesi kedaluwarsa dan mengalihkan pengguna ke halaman login.
router.post(
  "/2fa/disable",
  requireAuth,
  changePasswordLimiter,
  async (req, res, next) => {
    try {
      const parsed = disableTotpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { rows } = await pool.query(
        `SELECT password_hash, totp_enabled, totp_secret, totp_last_step
         FROM users WHERE id = $1`,
        [req.user.id],
      );
      const user = rows[0];
      if (!user) {
        return res.status(401).json({ message: "Akun tidak ditemukan." });
      }
      if (!user.totp_enabled || !user.totp_secret) {
        return res.status(400).json({
          message: "Verifikasi dua langkah belum aktif.",
        });
      }

      const passwordMatches = await bcrypt.compare(
        parsed.data.password,
        user.password_hash,
      );
      if (!passwordMatches) {
        return res.status(400).json({ message: "Password salah." });
      }

      // afterStep menolak kode dari langkah yang sudah terpakai, sama seperti
      // saat login: kode lama tidak bisa dipakai ulang untuk mematikan 2FA.
      const { ok } = await verifyCode(
        decryptSecret(user.totp_secret),
        parsed.data.code,
        { afterStep: toTimeStep(user.totp_last_step) },
      );
      if (!ok) {
        return res.status(400).json({ message: "Kode verifikasi salah." });
      }

      await pool.query(
        `UPDATE users
         SET totp_enabled = false, totp_secret = NULL, totp_last_step = NULL
         WHERE id = $1`,
        [req.user.id],
      );
      await logAudit(req, "totp-disable", "user", req.user.id);

      return res.json({
        message: "Verifikasi dua langkah berhasil dinonaktifkan.",
        totpEnabled: false,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
