// Backup dan pemulihan isi situs. Dipasang di /api/admin/backup dan hanya
// untuk admin (requireAdmin dipasang di app.js). Dua operasi di sini menyentuh
// seluruh data, jadi pembacaannya memakai satu transaksi REPEATABLE READ dan
// pemulihannya memakai satu transaksi tulis.
//
// Pemulihan bersifat mengganti: kategori, artikel, dan konten situs diganti
// dengan isi backup. Berkas gambar hanya ditambah/ditimpa, tidak pernah dihapus.
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ZipArchive } from "archiver";
import bcrypt from "bcrypt";
import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import multer from "multer";
import yauzl from "yauzl";
import { z } from "zod";
import { serverDirPath } from "../config/env.js";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { cleanContent } from "../services/articles.js";
import { SITE_CONTENT_KEYS, siteContentSchemas } from "../services/siteContent.js";
import {
  detectImage,
  extractUploadUrls,
  isUploadUrl,
  uploadDir,
} from "../services/uploads.js";

const router = express.Router();

// Seluruh endpoint di router ini hanya untuk admin.
router.use(requireAdmin);

// Snapshot sebelum pemulihan disimpan di sini dan tidak ikut di-commit.
const backupDir = path.join(serverDirPath, "backups");
const MAX_SNAPSHOTS = 3;
// Kunci advisory tetap: dua pemulihan tidak boleh berjalan bersamaan.
const RESTORE_LOCK_KEY = 20261017;

const MAX_ENTRIES = 5000;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const MAX_DATA_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const UPLOAD_NAME_PATTERN = /^[0-9a-fA-F-]{1,64}\.(jpg|png|webp)$/;
const UPLOAD_ENTRY_PATTERN = /^uploads\/([^/]+)$/;

// Limiter dipisah per pengguna, bukan per IP: beberapa pengelola bisa memakai
// satu IP kantor. requireAuth sudah berjalan sebelum router ini.
const limiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
};

const downloadLimiter = rateLimit({
  ...limiterOptions,
  limit: 10,
  message: {
    message: "Terlalu banyak unduhan backup. Coba lagi beberapa saat lagi.",
  },
});

const restoreLimiter = rateLimit({
  ...limiterOptions,
  limit: 5,
  message: {
    message: "Terlalu banyak percobaan pemulihan. Coba lagi beberapa saat lagi.",
  },
});

// Berkas sementara ditulis ke folder temp sistem, bukan ke memori: berkas
// backup bisa mencapai 100 MB. Batas 1 berkas dan field teks "password"
// ditangani multer; field teks tetap masuk ke req.body.
const multipart = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename(req, file, callback) {
      callback(null, `bumdesma-backup-${randomUUID()}.zip`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
});

function uploadBackupFile(req, res, next) {
  multipart.single("backup")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Ukuran file backup maksimal 100 MB." });
    }
    return res
      .status(400)
      .json({ message: "File backup tidak dapat dibaca. Coba lagi." });
  });
}

/* ------------------------------------------------------------- utilitas ---- */

function fileTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  );
}

const toIso = (value) => (value ? new Date(value).toISOString() : null);

async function fileExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

// 400 = isi berkas/permintaan ditolak, bukan kesalahan server.
function invalidBackup(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/* --------------------------------------------------------- baca snapshot --- */

// Membaca seluruh data dalam satu transaksi REPEATABLE READ supaya jumlah di
// data.json konsisten dengan isinya. Daftar berkas diperiksa setelah transaksi
// selesai: berkas yang sudah tidak ada dicatat di missingFiles, bukan
// menggagalkan backup.
async function readSnapshot() {
  const client = await pool.connect();
  let categories;
  let articles;
  let siteRows;

  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    ({ rows: categories } = await client.query(
      "SELECT name, slug FROM categories ORDER BY id",
    ));

    ({ rows: articles } = await client.query(`
      SELECT a.title,
             a.slug,
             a.excerpt,
             a.content_html AS "contentHtml",
             a.cover_image_url AS "coverImageUrl",
             c.slug AS "categorySlug",
             u.email AS "authorEmail",
             a.status,
             a.published_at AS "publishedAt",
             a.created_at AS "createdAt",
             a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN users u ON u.id = a.author_id
      ORDER BY a.created_at, a.id
    `));

    ({ rows: siteRows } = await client.query(
      "SELECT key, content FROM site_content ORDER BY key",
    ));

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  const normalizedArticles = articles.map((article) => ({
    ...article,
    publishedAt: toIso(article.publishedAt),
    createdAt: toIso(article.createdAt),
    updatedAt: toIso(article.updatedAt),
  }));

  const referenced = new Set();
  for (const article of normalizedArticles) {
    if (article.coverImageUrl && isUploadUrl(article.coverImageUrl)) {
      referenced.add(path.basename(article.coverImageUrl));
    }
    for (const url of extractUploadUrls(article.contentHtml)) {
      referenced.add(path.basename(url));
    }
  }

  const files = [];
  const missingFiles = [];
  for (const name of [...referenced].sort()) {
    const filePath = path.join(uploadDir, name);
    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error("bukan berkas");
      files.push({ name, path: filePath });
    } catch {
      missingFiles.push(`/uploads/${name}`);
    }
  }

  const data = {
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    categories,
    articles: normalizedArticles,
    siteContent: Object.fromEntries(siteRows.map((row) => [row.key, row.content])),
    counts: {
      categories: categories.length,
      articles: normalizedArticles.length,
      siteContent: siteRows.length,
      files: files.length,
    },
    missingFiles,
  };

  return { data, files };
}

function createArchive(snapshot) {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.append(JSON.stringify(snapshot.data, null, 2), { name: "data.json" });
  for (const file of snapshot.files) {
    archive.file(file.path, { name: `uploads/${file.name}` });
  }
  return archive;
}

async function writeArchiveToFile(target, snapshot) {
  const archive = createArchive(snapshot);
  const output = createWriteStream(target);
  const finished = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
    // Berkas yang hilang di tengah proses hanya memicu peringatan; snapshot
    // tetap dibuat supaya pemulihan tidak kehilangan data yang masih ada.
    archive.on("warning", (error) => {
      console.warn(`Peringatan saat menulis backup: ${error.message}`);
    });
  });

  archive.pipe(output);
  archive.finalize().catch((error) => output.emit("error", error));
  await finished;
}

/* ------------------------------------------------- unduh backup (GET) ------ */

router.get("/download", downloadLimiter, async (req, res) => {
  let snapshot;
  try {
    snapshot = await readSnapshot();
  } catch (error) {
    console.error(`Backup gagal dibuat (admin ${req.user.id}):`, error.message);
    return res
      .status(500)
      .json({ message: "Backup gagal dibuat. Coba lagi beberapa saat lagi." });
  }

  const filename = `bumdesma-backup-${fileTimestamp()}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  const archive = createArchive(snapshot);
  archive.on("error", (error) => {
    console.error(`Gagal mengirim backup (admin ${req.user.id}):`, error.message);
    res.destroy(error);
  });
  archive.on("warning", (error) => {
    console.warn(`Peringatan saat mengirim backup: ${error.message}`);
  });
  res.on("close", () => {
    if (!res.writableEnded) archive.abort();
  });

  archive.pipe(res);
  await archive.finalize().catch(() => {});

  const { categories, articles, siteContent, files } = snapshot.data.counts;
  console.log(
    `Backup diunduh oleh admin ${req.user.id}: ${categories} kategori, ` +
      `${articles} artikel, ${siteContent} konten situs, ${files} gambar.`,
  );
  return undefined;
});

/* ------------------------------------------------ validasi isi backup ------ */

const slugSchema = z
  .string()
  .trim()
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const isoDateSchema = z
  .string()
  .trim()
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)));

const nullableIsoDateSchema = z.union([isoDateSchema, z.null()]);

const coverImageSchema = z.union([
  z
    .string()
    .trim()
    .max(500)
    .regex(/^\/uploads\/[0-9a-f-]+\.(jpg|png|webp)$/i),
  z.null(),
]);

const backupArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  excerpt: z.string().max(1000),
  contentHtml: z.string().max(1_000_000),
  coverImageUrl: coverImageSchema,
  categorySlug: z.union([slugSchema, z.null()]),
  status: z.enum(["draft", "published"]),
  publishedAt: nullableIsoDateSchema,
  createdAt: nullableIsoDateSchema,
  updatedAt: nullableIsoDateSchema,
  authorEmail: z.union([z.string().trim().email().max(254), z.null()]),
});

const backupDataSchema = z.object({
  formatVersion: z
    .number()
    .int()
    .refine((value) => value === 1, "Versi format backup tidak didukung."),
  createdAt: z.string().optional(),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      }),
    )
    .max(1000),
  articles: z.array(backupArticleSchema).max(5000),
  // Kunci konten situs divalidasi satu per satu dengan skema yang dipakai
  // endpoint konten situs, lalu nilainya disusun ulang di pemanggil.
  siteContent: z.record(z.string(), z.unknown()),
});

function validateSiteContent(siteContent) {
  const result = {};
  for (const [key, content] of Object.entries(siteContent)) {
    if (!SITE_CONTENT_KEYS.includes(key)) {
      throw invalidBackup(`Kunci konten situs tidak dikenal: ${key}.`);
    }
    const parsed = siteContentSchemas[key].safeParse(content);
    if (!parsed.success) {
      throw invalidBackup(`Konten situs "${key}" tidak valid di dalam backup.`);
    }
    result[key] = parsed.data;
  }
  return result;
}

async function readEntryBuffer(zipfile, entry, maxBytes) {
  const stream = await zipfile.openReadStreamPromise(entry);
  const chunks = [];
  let size = 0;

  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) {
      stream.destroy();
      throw invalidBackup("Isi berkas di dalam backup terlalu besar.");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// Membaca isi zip dan menaruh gambar yang lolos validasi di folder staging.
// Tidak ada satu pun berkas yang ditulis ke uploads/ di sini: seluruh isi harus
// lolos dulu. Nama entri tidak pernah dipakai sebagai path tujuan; berkas
// staging selalu memakai basename yang sudah dicocokkan dengan pola nama.
async function readBackupZip(zipPath, stagingDir) {
  let zipfile;
  try {
    // strictFileNames: entri dengan backslash ditolak, bukan diubah menjadi
    // pemisah path.
    zipfile = await yauzl.openPromise(zipPath, { strictFileNames: true });
  } catch {
    throw invalidBackup("File backup bukan arsip ZIP yang valid.");
  }

  let entryCount = 0;
  let totalBytes = 0;
  let dataBuffer = null;
  const staged = [];
  const stageNames = new Set();

  try {
    for await (const entry of zipfile.eachEntry()) {
      entryCount += 1;
      if (entryCount > MAX_ENTRIES) {
        throw invalidBackup("Jumlah berkas di dalam backup melebihi 5.000.");
      }

      const name = entry.fileName;
      if (
        name.includes("..") ||
        name.startsWith("/") ||
        name.includes("\\") ||
        /^[a-zA-Z]:/.test(name)
      ) {
        throw invalidBackup("Backup berisi nama berkas yang tidak aman.");
      }

      const declared = Number(entry.uncompressedSize) || 0;
      if (totalBytes + declared > MAX_TOTAL_BYTES) {
        throw invalidBackup("Ukuran isi backup melebihi 200 MB.");
      }

      if (name === "data.json") {
        if (dataBuffer) {
          throw invalidBackup("Backup berisi lebih dari satu data.json.");
        }
        if (declared > MAX_DATA_BYTES) {
          throw invalidBackup("data.json di dalam backup melebihi 10 MB.");
        }
        dataBuffer = await readEntryBuffer(zipfile, entry, MAX_DATA_BYTES);
        totalBytes += dataBuffer.length;
        continue;
      }

      const match = UPLOAD_ENTRY_PATTERN.exec(name);
      if (!match) {
        throw invalidBackup("Backup berisi berkas yang tidak dikenal.");
      }

      const filename = match[1];
      if (!UPLOAD_NAME_PATTERN.test(filename)) {
        throw invalidBackup("Nama berkas gambar di dalam backup tidak valid.");
      }
      if (stageNames.has(filename)) {
        throw invalidBackup("Backup berisi gambar dengan nama yang sama.");
      }
      if (declared > MAX_FILE_BYTES) {
        throw invalidBackup(`Gambar ${filename} melebihi ukuran 2 MB.`);
      }

      const buffer = await readEntryBuffer(zipfile, entry, MAX_FILE_BYTES);
      totalBytes += buffer.length;
      if (totalBytes > MAX_TOTAL_BYTES) {
        throw invalidBackup("Ukuran isi backup melebihi 200 MB.");
      }

      const extension = filename.split(".").pop().toLowerCase();
      const image = detectImage(buffer);
      if (!image || image.extension !== extension) {
        throw invalidBackup(
          `Isi berkas ${filename} bukan gambar yang sesuai dengan namanya.`,
        );
      }

      const stagedPath = path.join(stagingDir, filename);
      await writeFile(stagedPath, buffer, { flag: "wx" });
      staged.push({ name: filename, path: stagedPath });
      stageNames.add(filename);
    }
  } catch (error) {
    if (error.status === 400) throw error;
    throw invalidBackup("File backup rusak atau bukan arsip ZIP yang valid.");
  } finally {
    try {
      zipfile.close();
    } catch {
      // Sudah tertutup otomatis setelah iterasi selesai.
    }
  }

  if (!dataBuffer) {
    throw invalidBackup("Backup tidak memuat data.json.");
  }

  let raw;
  try {
    raw = JSON.parse(dataBuffer.toString("utf8"));
  } catch {
    throw invalidBackup("data.json di dalam backup bukan JSON yang valid.");
  }

  const parsed = backupDataSchema.safeParse(raw);
  if (!parsed.success) {
    throw invalidBackup("Isi data.json tidak sesuai dengan format backup.");
  }

  return {
    data: {
      ...parsed.data,
      siteContent: validateSiteContent(parsed.data.siteContent),
    },
    files: staged,
  };
}

/* ------------------------------------------------- snapshot pra-restore ---- */

// Snapshot ditulis sebelum ada perubahan apa pun. Kegagalan membuat snapshot
// menggagalkan pemulihan: lebih aman tidak memulihkan daripada memulihkan
// tanpa jalan kembali.
async function writePreRestoreSnapshot(adminId) {
  await mkdir(backupDir, { recursive: true });

  const snapshot = await readSnapshot();
  const base = `pre-restore-${fileTimestamp()}`;
  let target = path.join(backupDir, `${base}.zip`);
  if (await fileExists(target)) {
    target = path.join(backupDir, `${base}-${randomUUID().slice(0, 6)}.zip`);
  }

  await writeArchiveToFile(target, snapshot);
  await pruneSnapshots();

  const { categories, articles, siteContent, files } = snapshot.data.counts;
  console.log(
    `Snapshot pra-restore dibuat oleh admin ${adminId}: ${path.basename(target)} ` +
      `(${categories} kategori, ${articles} artikel, ${siteContent} konten situs, ${files} gambar).`,
  );
  return target;
}

async function pruneSnapshots() {
  const names = (await readdir(backupDir)).filter((name) =>
    /^pre-restore-.+\.zip$/.test(name),
  );

  const entries = [];
  for (const name of names) {
    const info = await stat(path.join(backupDir, name)).catch(() => null);
    if (info) entries.push({ name, time: info.mtimeMs });
  }

  entries.sort((a, b) => b.time - a.time);
  for (const entry of entries.slice(MAX_SNAPSHOTS)) {
    await unlink(path.join(backupDir, entry.name)).catch(() => {});
  }
}

/* ------------------------------------------------ pulihkan backup (POST) --- */

// Semua perubahan data terjadi di satu transaksi. Berkas gambar baru disalin
// setelah COMMIT, jadi kegagalan menulis berkas tidak membatalkan data yang
// sudah tersimpan.
async function replaceData(client, data, adminId) {
  const { rows: userRows } = await client.query(
    "SELECT id, email FROM users",
  );
  const userByEmail = new Map(
    userRows.map((row) => [row.email.toLowerCase(), row.id]),
  );

  await client.query("DELETE FROM articles");
  await client.query("DELETE FROM categories");
  await client.query("DELETE FROM site_content");

  const categoryIds = new Map();
  for (const category of data.categories) {
    const { rows } = await client.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id",
      [category.name, category.slug],
    );
    categoryIds.set(category.slug, rows[0].id);
  }

  for (const article of data.articles) {
    const authorId =
      (article.authorEmail && userByEmail.get(article.authorEmail.toLowerCase())) ||
      adminId;
    const categoryId = article.categorySlug
      ? categoryIds.get(article.categorySlug) ?? null
      : null;

    await client.query(
      `INSERT INTO articles
        (title, slug, excerpt, content_html, cover_image_url, category_id,
         author_id, status, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz,
         COALESCE($10::timestamptz, now()), COALESCE($11::timestamptz, now()))`,
      [
        article.title,
        article.slug,
        article.excerpt,
        // HTML dari backup tidak pernah dipercaya: selalu dibersihkan ulang
        // dengan sanitizer yang sama seperti saat artikel disimpan.
        cleanContent(article.contentHtml),
        article.coverImageUrl,
        categoryId,
        authorId,
        article.status,
        article.publishedAt,
        article.createdAt,
        article.updatedAt,
      ],
    );
  }

  for (const [key, content] of Object.entries(data.siteContent)) {
    await client.query(
      `INSERT INTO site_content (key, content, updated_by)
       VALUES ($1, $2::jsonb, $3)`,
      [key, JSON.stringify(content), adminId],
    );
  }
}

// Menyalin gambar yang sudah divalidasi dari folder staging ke uploads/.
// Ditulis dengan nama sementara lalu di-rename supaya tidak pernah ada berkas
// setengah jadi yang dipakai halaman publik.
async function writeStagedUploads(files) {
  const failedFiles = [];
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Folder unggahan tidak dapat dibuat:", error.message);
    return files.map((file) => file.name);
  }

  for (const file of files) {
    const target = path.join(uploadDir, path.basename(file.name));
    const temporary = path.join(uploadDir, `.restore-${randomUUID()}.tmp`);
    try {
      await copyFile(file.path, temporary);
      await rename(temporary, target);
    } catch (error) {
      console.error(`Gagal menulis gambar ${file.name}:`, error.message);
      await unlink(temporary).catch(() => {});
      failedFiles.push(file.name);
    }
  }

  return failedFiles;
}

router.post(
  "/restore",
  restoreLimiter,
  uploadBackupFile,
  async (req, res) => {
    const tempZip = req.file?.path ?? "";
    let stagingDir = "";

    try {
      if (!tempZip) {
        return res
          .status(400)
          .json({ message: "Pilih file backup (.zip) yang akan dipulihkan." });
      }

      const password =
        typeof req.body?.password === "string" ? req.body.password : "";

      // Password dibaca dari database, bukan dari req.user (yang memang tidak
      // memuat hash). Password salah selalu 400: 401 akan membuat frontend
      // mengira sesi berakhir dan mengalihkan admin ke halaman login.
      const { rows } = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [req.user.id],
      );
      const passwordMatches =
        Boolean(rows[0]) &&
        password.length > 0 &&
        (await bcrypt.compare(password, rows[0].password_hash));
      if (!passwordMatches) {
        return res.status(400).json({ message: "Password salah." });
      }

      stagingDir = await mkdtemp(path.join(os.tmpdir(), "bumdesma-restore-"));
      const backup = await readBackupZip(tempZip, stagingDir);

      // Snapshot dibuat setelah isi backup lolos validasi tetapi sebelum satu
      // pun data diubah.
      await writePreRestoreSnapshot(req.user.id);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [
          RESTORE_LOCK_KEY,
        ]);
        await replaceData(client, backup.data, req.user.id);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }

      const failedFiles = await writeStagedUploads(backup.files);
      const counts = {
        categories: backup.data.categories.length,
        articles: backup.data.articles.length,
        siteContent: Object.keys(backup.data.siteContent).length,
        files: backup.files.length - failedFiles.length,
      };

      console.log(
        `Backup dipulihkan oleh admin ${req.user.id}: ${counts.categories} kategori, ` +
          `${counts.articles} artikel, ${counts.siteContent} konten situs, ` +
          `${counts.files} gambar, ${failedFiles.length} gagal.`,
      );

      return res.json({
        message: "Backup berhasil dipulihkan.",
        counts,
        failedFiles,
      });
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ message: error.message });
      }

      console.error(
        `Pemulihan backup gagal (admin ${req.user.id}):`,
        error.message,
      );
      return res.status(500).json({
        message:
          "Pemulihan backup gagal. Tidak ada data yang diubah. Periksa file backup lalu coba lagi.",
      });
    } finally {
      if (tempZip) await rm(tempZip, { force: true }).catch(() => {});
      if (stagingDir) {
        await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  },
);

export default router;
