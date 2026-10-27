// Uji berkas SEO yang tidak membutuhkan database. Router dipasang pada aplikasi
// Express kecil dengan port acak, jadi /share/:slug bisa diuji tanpa menjalankan
// server API terpisah. Slug tidak valid ditolak sebelum query, sehingga jalur 404
// tetap bisa diuji tanpa koneksi Postgres.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import seoRoutes from "../routes/seo.js";
import { escapeXml } from "../services/xml.js";

let server = null;
let baseUrl = "";

before(async () => {
  const app = express();
  app.use(seoRoutes);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  // Koneksi keep-alive dari fetch tidak boleh menahan proses tes tetap hidup.
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

describe("Cache-Control pratinjau tautan /share/:slug", () => {
  it("slug tidak valid dijawab 404 dengan Cache-Control: no-store", async () => {
    const response = await fetch(`${baseUrl}/share/Bukan-Slug-Valid`);
    const body = await response.text();

    assert.equal(response.status, 404);
    // 404 tidak boleh tersimpan di cache perantara: slug bisa dibuat kapan saja
    // dan pratinjau basi akan terus disajikan setelahnya.
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(
      response.headers.get("content-type") ?? "",
      /text\/html/,
      "404 pratinjau tetap harus berupa HTML yang bisa dibuka",
    );
    assert.match(body, /Artikel tidak ditemukan/);
  });

  it("404 tidak menyetel masa cache publik 300 detik", async () => {
    const response = await fetch(`${baseUrl}/share/Bukan-Slug-Valid`);
    await response.text();

    assert.doesNotMatch(
      response.headers.get("cache-control") ?? "",
      /max-age=300/,
      "hanya respons 200 yang boleh di-cache 300 detik",
    );
  });
});

describe("escapeXml", () => {
  it("membuang karakter kontrol yang tidak sah di XML", () => {
    // Rentang yang dilarang XML 1.0: \u0000-\u0008, \u000B, \u000C, \u000E-\u001F.
    const controls =
      "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008" +
      "\u000B\u000C" +
      "\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017" +
      "\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F";

    assert.equal(escapeXml(`a${controls}b`), "ab");
  });

  it("mempertahankan tab, baris baru, dan carriage return", () => {
    // Karakter ini sah di XML, jadi tidak boleh ikut terbuang.
    assert.equal(escapeXml("a\tb\nc\rd"), "a\tb\nc\rd");
  });

  it("meng-escape lima karakter khusus XML setelah membuang karakter kontrol", () => {
    assert.equal(escapeXml(`<>&"'`), "&lt;&gt;&amp;&quot;&apos;");
    // Karakter kontrol di sekitar markup tidak boleh mengubah hasil escape.
    assert.equal(escapeXml("\u0000</title>\u001F"), "&lt;/title&gt;");
    assert.equal(escapeXml("\u0000&\u001F"), "&amp;");
  });

  it("nilai null dan undefined menjadi string kosong", () => {
    assert.equal(escapeXml(null), "");
    assert.equal(escapeXml(undefined), "");
  });
});
