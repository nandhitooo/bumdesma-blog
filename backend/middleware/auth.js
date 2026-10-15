import jwt from "jsonwebtoken";
import { AUTH_COOKIE, TOKEN_TTL_SECONDS, env } from "../config/env.js";
import { pool } from "../db/pool.js";

export { AUTH_COOKIE };

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS * 1000,
  };
}

export function clearCookieOptions() {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  return options;
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function loadUser(id) {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
    [id],
  );
  return rows[0] || null;
}

// Menandai request dengan req.user bila cookie JWT valid; kalau tidak, 401.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];

  if (!token) {
    return res.status(401).json({ message: "Belum login. Silakan masuk dulu." });
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    res.clearCookie(AUTH_COOKIE, clearCookieOptions());
    return res
      .status(401)
      .json({ message: "Sesi tidak valid atau kedaluwarsa. Silakan login ulang." });
  }

  try {
    const user = await loadUser(Number(payload.sub));
    if (!user) {
      res.clearCookie(AUTH_COOKIE, clearCookieOptions());
      return res.status(401).json({ message: "Akun tidak ditemukan." });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Hanya admin yang boleh mengakses bagian ini." });
  }
  return next();
}
