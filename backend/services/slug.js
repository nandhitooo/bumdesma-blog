import { z } from "zod";

// Nilai dari URL bisa memuat byte NUL setelah decodeURIComponent (mis. "%00").
// Postgres menolaknya dengan error 22021 ("invalid byte sequence for encoding
// UTF8: 0x00"), dan sebelumnya request seperti itu berakhir 500 tanpa pesan
// yang berguna. Nilainya tidak mungkin cocok dengan data mana pun, jadi
// ditolak lebih awal sebagai 400. Dicek per karakter (bukan regex) karena
// rentang kontrol memang disengaja dan aturan eslint no-control-regex
// menandai pola seperti itu sebagai kesalahan.
function hasControlCharacters(value) {
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

// Slug dari potongan URL. Batas panjangnya mengikuti kolom slug di database
// (220 karakter, sama seperti skema artikel). Pola huruf/angka tidak dipaksakan
// di sini: slug yang tidak ada tetap harus dijawab 404, bukan 400.
export const slugParamSchema = z
  .string()
  .trim()
  .min(1, "Slug tidak valid.")
  .max(220, "Slug tidak valid.")
  .refine((value) => !hasControlCharacters(value), "Slug tidak valid.");

// Kata kunci/filter berupa teks bebas dari kotak pencarian. Hanya byte NUL yang
// ditolak: itu satu-satunya karakter yang membuat Postgres melempar 22021,
// sedangkan tab atau baris baru (mis. hasil tempel) tetap boleh lewat seperti
// sebelumnya. `min` dibiarkan 0 secara bawaan supaya nilai kosong tetap
// dianggap "tanpa filter".
export function keywordSchema({ min = 0, max, message }) {
  return z
    .string()
    .trim()
    .min(min, message)
    .max(max, message)
    .refine((value) => !value.includes("\u0000"), message);
}
