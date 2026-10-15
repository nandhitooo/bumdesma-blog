import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env, serverDirPath } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import articlesRoutes from "./routes/articles.js";
import categoriesRoutes, {
  adminRouter as adminCategoriesRoutes,
} from "./routes/categories.js";
import usersRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

// crossOriginResourcePolicy dibuka agar gambar artikel di /uploads bisa dimuat
// dari origin frontend (localhost:5173 saat dev).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

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

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
app.use("/api/admin", requireAuth);
app.use("/api/admin/articles", articlesRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
