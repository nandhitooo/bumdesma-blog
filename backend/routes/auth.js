import express from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import {
  AUTH_COOKIE,
  clearCookieOptions,
  cookieOptions,
  publicUser,
  requireAuth,
  signToken,
} from "../middleware/auth.js";

const router = express.Router();

const loginSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Format email tidak valid.")),
  password: z
    .string({ error: "Password wajib diisi." })
    .min(1, "Password wajib diisi."),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.",
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
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    res.cookie(AUTH_COOKIE, signToken(user), cookieOptions());
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

export default router;
