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
import usersRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import { requireAuth } from "./middleware/auth.js";
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
      if (!origin || origin === env.clientOrigin) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

// Batas umum untuk seluruh API, dijalankan sebelum body di-parse supaya
// request yang ditolak tidak diproses lebih jauh. Login punya limiter sendiri
// yang lebih ketat di routes/auth.js.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi." },
});

app.use("/api", apiLimiter);

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
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/site-content", siteContentRoutes);
// requireAuth dipasang untuk seluruh /api/admin, jadi router admin di bawahnya
// tidak perlu memasangnya lagi. Router admin artikel tidak memakai requireAdmin
// karena editor juga berhak mengelola artikel miliknya sendiri.
app.use("/api/admin", requireAuth);
app.use("/api/admin/articles", adminArticlesRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/site-content", adminSiteContentRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
