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
