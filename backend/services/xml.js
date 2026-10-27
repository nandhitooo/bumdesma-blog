// Helper XML dipisah dari routes/seo.js supaya aturannya bisa diuji tanpa
// database maupun server HTTP.

const XML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

// Karakter kontrol yang tidak sah di XML 1.0 (termasuk NUL) membuat seluruh
// dokumen ditolak parser, jadi dibuang sebelum escape.
const XML_INVALID_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

// Semua nilai yang berasal dari database atau env harus melewati fungsi ini
// sebelum masuk ke XML. Tanpa escape, judul artikel bisa menyisipkan tag atau
// menutup atribut.
export function escapeXml(value) {
  return String(value ?? "")
    .replace(XML_INVALID_CONTROL, "")
    .replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}
