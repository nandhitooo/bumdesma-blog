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
const EXTRA_REFERENCES = [
  { table: "gallery_items", column: "image_url" },
  { table: "team_members", column: "photo_url" },
  // Revisi menyimpan salinan lama artikel. Gambar yang hanya muncul di riwayat
  // tetap harus dianggap terpakai, kalau tidak gambar di dialog revisi rusak.
  { table: "article_revisions", column: "cover_image_url" },
  { table: "article_revisions", column: "content_html", contains: true },
];

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

// Batas jumlah piksel masukan. Gambar "bom dekompresi" berukuran berkas kecil
// (mis. PNG 2 MB) bisa mengembang jadi ratusan juta piksel dan menghabiskan
// memori saat didekode; sharp menolaknya bila melewati batas ini.
const MAX_INPUT_PIXELS = 24_000_000;

// Memperbaiki orientasi berdasarkan EXIF, mengecilkan lebar maksimal 1600 px
// tanpa memperbesar gambar kecil, lalu mengonversi ke WebP. Metadata tidak ikut
// ditulis karena sharp hanya menyertakannya bila diminta secara eksplisit.
export async function processUploadedImage(buffer) {
  try {
    const processed = await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer: processed, extension: "webp" };
  } catch (error) {
    // sharp 0.35.5 menolak dekode yang melewati limitInputPixels dengan pesan
    // "Input image exceeds pixel limit" (sudah diperiksa langsung, bukan tebakan).
    // Hanya pesan itu yang diterjemahkan; kegagalan lain tetap generik supaya
    // detail internal tidak bocor ke pengunggah.
    const tooLarge = /exceeds pixel limit/i.test(error?.message ?? "");
    const failure = new Error(
      tooLarge
        ? "Resolusi gambar terlalu besar (maksimal sekitar 24 megapiksel). Perkecil gambar lalu unggah ulang."
        : "Gambar tidak dapat diproses.",
    );
    failure.status = 400;
    throw failure;
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
      for (const { table, column, contains } of EXTRA_REFERENCES) {
        // `contains` dipakai kolom HTML: URL bisa berada di tengah markup.
        const reference = await pool.query(
          contains
            ? `SELECT 1 FROM ${table} WHERE ${column} LIKE $1 LIMIT 1`
            : `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
          [contains ? `%${url}%` : url],
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
