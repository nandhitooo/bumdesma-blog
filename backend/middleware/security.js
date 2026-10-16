import { env } from "../config/env.js";

// Metode yang tidak mengubah data tidak perlu diperiksa asalnya.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Pertahanan berlapis di samping SameSite=Lax pada cookie sesi: request yang
// mengubah data tetapi membawa header Origin milik situs lain ditolak. Klien
// non-browser (curl, health check, skrip internal) tidak mengirim Origin,
// sehingga tetap diizinkan seperti sebelumnya.
export function originCheck(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin || origin === env.clientOrigin) return next();

  return res
    .status(403)
    .json({ message: "Permintaan ditolak: asal permintaan tidak dikenal." });
}

// Respons yang memuat data sesi atau data panel admin tidak boleh disimpan di
// cache bersama (komputer bersama, proxy kantor, maupun browser pengguna).
export function noStore(req, res, next) {
  res.set("Cache-Control", "no-store");
  return next();
}
