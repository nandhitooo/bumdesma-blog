// Helper tanggal yang dipakai bersama oleh halaman publik (Home, BlogList,
// BlogDetail) supaya format tanggal tidak ditulis ulang di tiap file.
const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Mengembalikan string kosong bila nilai tanggal tidak ada / tidak valid,
// sehingga pemanggil bisa langsung menaruh hasilnya di JSX.
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return longDateFormatter.format(date);
}
