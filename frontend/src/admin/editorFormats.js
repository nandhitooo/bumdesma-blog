// Sumber tunggal pilihan format teks untuk editor artikel. Nilai `value`
// adalah nilai CSS yang disimpan apa adanya di HTML, jadi daftar ini harus
// sejalan dengan whitelist di backend/services/articles.js (ALLOWED_FONT_FAMILIES
// dan ALLOWED_FONT_SIZES). Sanitizer backend membuang nilai di luar daftar itu,
// jadi ubah keduanya bersamaan.

// Font pertama adalah font bawaan halaman (lihat body di index.css), sehingga
// memilihnya berarti menghapus font-family, bukan menyimpan nilai yang sama.
export const FONT_FAMILIES = [
  { label: "Poppins (bawaan)", value: "Poppins" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: '"Times New Roman"' },
  { label: "Arial", value: "Arial" },
  { label: "Verdana", value: "Verdana" },
  { label: "Courier New", value: '"Courier New"' },
];

export const DEFAULT_FONT_FAMILY = FONT_FAMILIES[0].value;

// Ukuran dalam piksel. Pilihan kosong di toolbar berarti ukuran bawaan.
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

export const TEXT_COLORS = [
  { label: "Hitam", value: "#111827" },
  { label: "Abu-abu", value: "#6b7280" },
  { label: "Hijau", value: "#15803d" },
  { label: "Hijau kebiruan", value: "#0f766e" },
  { label: "Biru", value: "#1d4ed8" },
  { label: "Ungu", value: "#7c3aed" },
  { label: "Merah", value: "#b91c1c" },
  { label: "Oranye", value: "#c2410c" },
];

export const HIGHLIGHT_COLORS = [
  { label: "Kuning", value: "#fef08a" },
  { label: "Hijau muda", value: "#bbf7d0" },
  { label: "Biru muda", value: "#bfdbfe" },
  { label: "Merah muda", value: "#fecaca" },
  { label: "Oranye muda", value: "#fed7aa" },
  { label: "Ungu muda", value: "#e9d5ff" },
  { label: "Merah jambu", value: "#fbcfe8" },
  { label: "Abu-abu muda", value: "#e5e7eb" },
];

// Tingkat judul yang didukung editor. "p" berarti paragraf biasa.
export const BLOCK_TYPES = [
  { label: "Paragraf", value: "p" },
  { label: "Judul H2", value: "2" },
  { label: "Judul H3", value: "3" },
  { label: "Judul H4", value: "4" },
];
