import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import express from "express";
import multer from "multer";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { detectImage, uploadDir } from "../services/uploads.js";

const router = express.Router();

// Unggah gambar dibatasi per pengguna, bukan per IP: satu kantor bisa memakai
// satu IP untuk beberapa pengelola sekaligus. requireAuth sudah dijalankan
// sebelum router ini, jadi req.user tersedia.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  message: {
    message: "Terlalu banyak unggahan gambar. Coba lagi beberapa saat lagi.",
  },
});
const mimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!mimeTypes.has(file.mimetype)) {
      const error = new Error("Format file harus JPG, PNG, atau WebP.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

router.post("/", uploadLimiter, multipart.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Pilih file gambar untuk diunggah." });
  }

  const image = detectImage(req.file.buffer);
  if (!image || image.mime !== req.file.mimetype) {
    return res.status(400).json({ message: "Isi file bukan gambar JPG, PNG, atau WebP yang valid." });
  }

  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${image.extension}`;
  await writeFile(path.join(uploadDir, filename), req.file.buffer, { flag: "wx" });
  return res.status(201).json({ url: `/uploads/${filename}` });
});

export default router;
