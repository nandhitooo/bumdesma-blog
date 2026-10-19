import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { serverDirPath } from "../config/env.js";
import { pool } from "../db/pool.js";

// Folder penyimpanan gambar unggahan. Dipakai juga oleh routes/upload.js supaya
// lokasinya hanya ditentukan di satu tempat.
export const uploadDir = path.join(serverDirPath, "uploads");

// Hanya URL yang dibuat server sendiri yang boleh disentuh untuk dihapus.
const UPLOAD_URL_PATTERN = /^\/uploads\/[0-9a-fA-F-]{1,64}\.(?:jpg|png|webp)$/;
const UPLOAD_URL_IN_HTML_PATTERN = /\/uploads\/[0-9a-fA-F-]{1,64}\.(?:jpg|png|webp)/gi;

// Tabel lain yang juga menyimpan URL unggahan. Daftar ini konstanta kode, bukan
// masukan pengguna, sehingga nama tabel/kolom aman disisipkan ke query. Tanpa
// pemeriksaan ini, gambar yang masih dipakai galeri bisa terhapus saat artikel
// yang memakai gambar yang sama diperbarui.
const EXTRA_REFERENCES = [{ table: "gallery_items", column: "image_url" }];

export function isUploadUrl(value) {
  return typeof value === "string" && UPLOAD_URL_PATTERN.test(value);
}

// Mengubah URL upload menjadi path absolut. Nama berkas diambil dengan
// path.basename dan hasilnya harus tetap berada di dalam folder uploads,
// sehingga nilai seperti "/uploads/../../backend/.env" tidak pernah lolos.
export function resolveUploadPath(url) {
  if (!isUploadUrl(url)) return null;

  const filePath = path.resolve(uploadDir, path.basename(url));
  const prefix = uploadDir.endsWith(path.sep) ? uploadDir : uploadDir + path.sep;
  return filePath.startsWith(prefix) ? filePath : null;
}

// Mengenali jenis gambar dari magic bytes, bukan dari nama atau header yang
// dikirim klien. Dipakai routes/upload.js dan juga saat memulihkan backup,
// karena isi arsip backup tidak boleh dipercaya begitu saja.
export function detectImage(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

// Memperbaiki orientasi berdasarkan EXIF, mengecilkan lebar maksimal 1600 px
// tanpa memperbesar gambar kecil, lalu mengonversi ke WebP. Metadata tidak ikut
// ditulis karena sharp hanya menyertakannya bila diminta secara eksplisit.
export async function processUploadedImage(buffer) {
  try {
    const processed = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer: processed, extension: "webp" };
  } catch {
    const error = new Error("Gambar tidak dapat diproses.");
    error.status = 400;
    throw error;
  }
}

// Semua gambar unggahan yang dirujuk di dalam HTML artikel (gambar inline).
export function extractUploadUrls(html) {
  if (typeof html !== "string") return [];

  const urls = new Set();
  for (const match of html.matchAll(UPLOAD_URL_IN_HTML_PATTERN)) {
    urls.add(match[0]);
  }
  return [...urls];
}

// Menghapus berkas yang sudah tidak dirujuk artikel mana pun. Dipanggil dengan
// daftar kandidat (gambar lama) sehingga berkas yang baru diunggah tetapi belum
// tersimpan di artikel tidak pernah tersentuh. Kegagalan hapus tidak pernah
// menggagalkan request; cukup dicatat.
export async function deleteUnreferencedUploads(candidates) {
  const unique = [...new Set(candidates.filter(isUploadUrl))];

  for (const url of unique) {
    const filePath = resolveUploadPath(url);
    if (!filePath) continue;

    try {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM articles
         WHERE cover_image_url = $1 OR content_html LIKE $2
         LIMIT 1`,
        [url, `%${url}%`],
      );

      if (rowCount > 0) continue;

      let referencedElsewhere = false;
      for (const { table, column } of EXTRA_REFERENCES) {
        const reference = await pool.query(
          `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
          [url],
        );
        if (reference.rowCount > 0) {
          referencedElsewhere = true;
          break;
        }
      }
      if (referencedElsewhere) continue;

      await unlink(filePath);
      console.log(`Berkas unggahan tidak lagi dirujuk, dihapus: ${url}`);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      console.error(`Gagal menghapus berkas unggahan ${url}:`, error.message);
    }
  }
}
