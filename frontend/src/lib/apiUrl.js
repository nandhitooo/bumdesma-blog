// Origin API opsional. Selama kosong (default), path dikembalikan apa adanya
// sehingga request tetap relatif ke origin yang sama: saat development Vite
// mem-proxy /api ke server Express, saat produksi reverse proxy yang menyajikan
// keduanya. Isi VITE_API_URL hanya bila API berdiri di origin lain, mis.
// https://api.situs.id — tanpa slash di akhir. Semua pemanggil mengirim path
// yang diawali "/", jadi penggabungan cukup base + path.
const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

export function apiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}
