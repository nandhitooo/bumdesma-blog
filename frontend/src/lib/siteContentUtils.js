export function isValidIcon(name) {
  return typeof name === "string" && /^[a-z0-9-]+$/.test(name);
}

export function safeHttpsUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

// Gambar hanya diterima bila berupa unggahan panel admin (/uploads/...) atau URL
// HTTPS. Selain itu komponen memakai aset bawaan yang diimpornya sendiri,
// sehingga tampilan tetap sama saat field gambar belum diisi.
export function safeImageUrl(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (/^\/uploads\/[0-9a-fA-F-]+\.(?:jpg|png|webp)$/i.test(trimmed)) {
    return trimmed;
  }
  return safeHttpsUrl(trimmed) || fallback;
}

// Tautan footer boleh menunjuk halaman di dalam situs ("/#about", "/blog") atau
// URL HTTPS. Nilai lain menjadi tautan mati agar tidak bisa dipakai mengarahkan
// pengunjung ke skema seperti javascript:.
export function safeFooterHref(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^\/(?:[a-z0-9][a-z0-9/-]*)?(?:#[a-z0-9-]+)?$/i.test(trimmed)) {
    return trimmed;
  }
  return safeHttpsUrl(trimmed);
}

export function safeWaLink(whatsapp) {
  const digits = String(whatsapp || "").trim();
  return /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}` : "";
}

export function safeMailto(email) {
  const value = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : "";
}

export function safePhoneLink(phone) {
  const value = String(phone || "").trim();
  return /\d/.test(value) && /^[+0-9().\s-]+$/.test(value) ? `tel:${value}` : "";
}
