import express from "express";
import path from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env, serverDirPath } from "./config/env.js";
import { pool } from "./db/pool.js";
import authRoutes from "./routes/auth.js";
import articlesRoutes, {
  adminRouter as adminArticlesRoutes,
} from "./routes/articles.js";
import categoriesRoutes, {
  adminRouter as adminCategoriesRoutes,
} from "./routes/categories.js";
import siteContentRoutes, {
  adminRouter as adminSiteContentRoutes,
} from "./routes/siteContent.js";
import documentsRoutes, {
  adminRouter as adminDocumentsRoutes,
} from "./routes/documents.js";
import teamRoutes, { adminRouter as adminTeamRoutes } from "./routes/team.js";
import usersRoutes from "./routes/users.js";
import galleryRoutes, {
  adminRouter as adminGalleryRoutes,
} from "./routes/gallery.js";
import uploadRoutes from "./routes/upload.js";
import backupRoutes from "./routes/backup.js";
import seoRoutes from "./routes/seo.js";
import { requireAuth } from "./middleware/auth.js";
import { noStore, originCheck } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.disable("x-powered-by");

// Logging dipasang paling awal supaya request yang ditolak pun tetap tercatat.
app.use(requestLogger);

// Hanya diaktifkan bila TRUST_PROXY diisi; tanpa reverse proxy, membiarkannya
// aktif membuat klien bisa memalsukan IP lewat header X-Forwarded-For.
if (env.trustProxy !== false) {
  app.set("trust proxy", env.trustProxy);
}

// crossOriginResourcePolicy dibuka agar gambar artikel di /uploads bisa dimuat
// dari origin frontend (localhost:5173 saat dev).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Kompresi respons teks/JSON. Gambar di /uploads sudah terkompresi sehingga
// tidak diproses ulang.
app.use(compression());

// CORS hanya untuk origin frontend dari env var. Origin lain tidak mendapat
// header Access-Control-Allow-Origin, jadi browser memblokirnya.
app.use(
  cors({
    origin(origin, callback) {
      // origin kosong = request non-browser (curl/server lain), diizinkan.
      // env.clientOrigins memuat semua origin dari CLIENT_ORIGIN, yang boleh
      // berisi beberapa nilai dipisah koma (mis. domain utama dan www-nya).
      if (!origin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

// Setiap request yang mengubah data dan datang dari origin lain ditolak.
// Dilakukan di samping CORS (yang hanya membatasi pembacaan respons di browser)
// dan SameSite=Lax pada cookie sesi.
app.use("/api", originCheck);

// Batas request dibagi dua. Halaman publik memanggil beberapa endpoint sekaligus
// (konten situs + daftar artikel), jadi satu kantor desa yang berbagi satu IP
// tidak boleh ikut terkunci hanya karena trafik baca. Penulisan data dibatasi
// lebih ketat; login dan unggah punya limiter sendiri di routes/auth.js dan
// routes/upload.js. Dijalankan sebelum body di-parse supaya request yang
// ditolak tidak diproses lebih jauh.
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi." },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak perubahan data. Coba lagi beberapa saat lagi.",
  },
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Pratinjau artikel tidak menulis apa pun: ia hanya mengembalikan HTML yang
// sudah dibersihkan. Penulis memakainya berkali-kali sambil menyunting, jadi
// request ini dikecualikan dari writeLimiter bersama dan dijaga oleh limiter
// per pengguna di routes/articles.js (60 per 15 menit). Pengecualiannya sempit:
// hanya POST tepat pada path ini, dan hanya untuk router admin artikel.
const PREVIEW_PATH = "/admin/articles/preview";

app.use("/api", (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return readLimiter(req, res, next);
  if (req.method === "POST" && req.path === PREVIEW_PATH) return next();
  return writeLimiter(req, res, next);
});

// Body parser menolak JSON yang tidak valid; errornya diubah menjadi 400 di
// middleware/errorHandler.js.
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health check sekaligus membuktikan koneksi database masih hidup.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check gagal:", error.message);
    return res.status(503).json({ status: "error" });
  }
});

app.use(
  "/uploads",
  express.static(path.join(serverDirPath, "uploads"), {
    dotfiles: "deny",
    index: false,
    // Berkas gambar publik boleh di-cache lama, tetapi tipenya tidak boleh
    // ditafsirkan ulang oleh browser dan isinya tidak boleh dijalankan.
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    },
  }),
);

// Respons yang memuat data sesi atau isi panel admin tidak boleh disimpan di
// cache browser maupun proxy perantara.
app.use("/api/auth", noStore);
app.use("/api/admin", noStore);

app.use("/api/auth", authRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/site-content", siteContentRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/team", teamRoutes);
// requireAuth dipasang untuk seluruh /api/admin, jadi router admin di bawahnya
// tidak perlu memasangnya lagi. Router admin artikel tidak memakai requireAdmin
// karena editor juga berhak mengelola artikel miliknya sendiri.
app.use("/api/admin", requireAuth);
app.use("/api/admin/articles", adminArticlesRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/site-content", adminSiteContentRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/admin/documents", adminDocumentsRoutes);
app.use("/api/admin/team", adminTeamRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/upload", uploadRoutes);
app.use("/api/admin/backup", backupRoutes);

// Berkas SEO dan pratinjau tautan berada di root domain (bukan /api) supaya
// perayap mesin pencari dan layanan pesan bisa mengaksesnya langsung.
app.use(seoRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
