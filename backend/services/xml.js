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
// dokumen ditolak parser, jadi dibuang. Rentangnya 0x00-0x08, 0x0B, 0x0C, dan
// 0x0E-0x1F; tab (0x09), baris baru (0x0A), dan carriage return (0x0D) sah dan
// dipertahankan. Disaring per code point, bukan dengan regex, karena regex
// karakter kontrol dilarang aturan eslint no-control-regex.
function stripInvalidXmlControls(value) {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0);
    const invalid =
      code <= 0x08 ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f);
    if (!invalid) result += char;
  }
  return result;
}

// Semua nilai yang berasal dari database atau env harus melewati fungsi ini
// sebelum masuk ke XML. Tanpa escape, judul artikel bisa menyisipkan tag atau
// menutup atribut.
export function escapeXml(value) {
  return stripInvalidXmlControls(String(value ?? "")).replace(
    /[&<>"']/g,
    (char) => XML_ESCAPES[char],
  );
}
