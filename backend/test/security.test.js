// Uji keamanan API. Dijalankan terhadap server yang sedang berjalan:
//
//   npm test                     # dari root repositori
//   API_URL=http://localhost:4000 npm test --workspace backend
//
// Kredensial admin dibaca dari backend/.env dan TIDAK pernah dicetak. Bila
// kredensial tidak tersedia, bagian uji yang membutuhkannya dilewati dengan
// pesan yang jelas. Uji ini membuat lalu menghapus sendiri pengguna editor dan
// artikel sementaranya (slug berawalan "zz-uji-").
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import yauzl from "yauzl";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env"), quiet: true });

const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const JWT_SECRET = process.env.JWT_SECRET || "";

const ARTICLE_SLUG = "zz-uji-keamanan-xss";
const FORMAT_SLUG = "zz-uji-format-teks";
const PARTIAL_SLUG = "zz-uji-put-parsial";
const XSS_PAYLOADS = [
  "<img src=x onerror=alert(1)>",
  '<a href="javascript:alert(1)">x</a>',
  '<img src="https://evil.example/x.png">',
  "<script>alert(1)</script>",
];

/* ------------------------------------------------------------------ util ---- */

async function request(pathname, options = {}) {
  const { method = "GET", body, cookie, headers = {}, raw } = options;
  const response = await fetch(`${API_URL}${pathname}`, {
    method,
    headers: {
      ...(body && !raw ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: raw ? body : body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { status: response.status, data, headers: response.headers, response };
}

function sessionCookie(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  const match = cookies.find((value) => value.startsWith("bumdesma_session="));
  assert.ok(match, "respons login harus menyetel cookie sesi");
  return match.split(";")[0];
}

async function login(email, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(
    result.status,
    200,
    `login gagal untuk salah satu akun uji (status ${result.status})`,
  );
  return result;
}

/* ------------------------------------------------------- util backup ------- */

// Membuat file zip dari daftar [namaEntri, isi] memakai archiver yang sama
// dengan yang dipakai server. Folder sementara selalu dibersihkan.
async function withBackupZip(entries, run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "zz-uji-backup-"));
  try {
    const filePath = path.join(dir, "backup.zip");
    const output = createWriteStream(filePath);
    const closed = once(output, "close");
    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.pipe(output);
    for (const [name, content] of entries) {
      archive.append(content, { name });
    }
    await archive.finalize();
    await closed;
    return await run(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function restoreBackup(cookie, password, zipPath) {
  const form = new FormData();
  form.append("password", password);
  form.append(
    "backup",
    new Blob([await readFile(zipPath)], { type: "application/zip" }),
    "backup.zip",
  );

  const response = await fetch(`${API_URL}/api/admin/backup/restore`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
    redirect: "manual",
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

// data.json minimal yang lolos validasi server.
function backupData(overrides = {}) {
  return JSON.stringify({
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    categories: [{ name: "Kategori Uji Backup", slug: "zz-uji-backup" }],
    articles: [],
    siteContent: {},
    counts: { categories: 1, articles: 0, siteContent: 0, files: 0 },
    missingFiles: [],
    ...overrides,
  });
}

async function readZipDataJson(buffer) {
  const zipfile = await yauzl.fromBufferPromise(buffer);
  for await (const entry of zipfile.eachEntry()) {
    if (entry.fileName !== "data.json") continue;
    const stream = await zipfile.openReadStreamPromise(entry);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  throw new Error("data.json tidak ditemukan di dalam backup");
}

/* ------------------------------------------------- ketersediaan server ------ */

let reachabilityError = "";
try {
  const health = await fetch(`${API_URL}/api/health`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!health.ok) reachabilityError = `GET /api/health menjawab ${health.status}`;
} catch (error) {
  reachabilityError = error.message;
}

const API_DOWN_MESSAGE =
  `API tidak dapat dihubungi di ${API_URL} (${reachabilityError}). ` +
  "Jalankan server backend lebih dulu (npm run server), lalu ulangi npm test.";
const skipWhenApiDown = reachabilityError ? API_DOWN_MESSAGE : false;

const SKIP_WITHOUT_ADMIN =
  "ADMIN_EMAIL dan ADMIN_PASSWORD belum tersedia di backend/.env, uji ini dilewati.";

/* ------------------------------------------------------------ tanpa login --- */

describe("Uji keamanan API", { skip: skipWhenApiDown }, () => {
  it("endpoint admin menolak permintaan tanpa sesi (401)", async () => {
    for (const pathname of [
      "/api/admin/articles",
      "/api/admin/categories",
      "/api/admin/users",
      "/api/admin/site-content",
    ]) {
      const result = await request(pathname);
      assert.equal(result.status, 401, `${pathname} harus 401 tanpa cookie`);
    }
  });

  it("pratinjau artikel menolak permintaan tanpa sesi (401)", async () => {
    const result = await request("/api/admin/articles/preview", {
      method: "POST",
      body: { contentHtml: "<p>Uji pratinjau</p>" },
    });
    assert.equal(result.status, 401, "pratinjau harus 401 tanpa cookie");
  });

  it("JSON rusak ditolak dengan 400", async () => {
    const result = await request("/api/auth/login", {
      method: "POST",
      raw: true,
      body: "{bad json",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(result.status, 400);
    assert.match(result.data.message, /JSON/i);
  });

  it("permintaan yang mengubah data dari origin lain ditolak (403)", async () => {
    const result = await request("/api/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "whatever" },
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(result.status, 403);
  });

  it("password lebih dari 72 byte ditolak (400)", async () => {
    const result = await request("/api/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "a".repeat(73) },
    });
    assert.equal(result.status, 400);
    assert.match(result.data.message, /72/);
  });

  it("ganti password menolak permintaan tanpa sesi (401)", async () => {
    const result = await request("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword: "apa-saja", newPassword: "PasswordBaru123" },
    });
    assert.equal(result.status, 401, "ganti password harus 401 tanpa cookie");
  });

  it("endpoint backup menolak permintaan tanpa sesi (401)", async () => {
    const download = await request("/api/admin/backup/download");
    assert.equal(download.status, 401, "unduh backup harus 401 tanpa cookie");

    const restore = await request("/api/admin/backup/restore", {
      method: "POST",
      raw: true,
      body: new FormData(),
    });
    assert.equal(restore.status, 401, "pulihkan backup harus 401 tanpa cookie");
  });

  it("/api/auth/me memakai Cache-Control: no-store", async () => {
    const result = await request("/api/auth/me");
    assert.equal(result.status, 401);
    assert.equal(result.headers.get("cache-control"), "no-store");
  });

  it("token dengan secret lain atau tanpa tanda tangan ditolak", async () => {
    // 1. Ditandatangani dengan secret yang salah.
    const wrongSecret = jwt.sign({ sub: "1", role: "admin" }, "bukan-secret-server", {
      algorithm: "HS256",
    });
    const forged = await request("/api/auth/me", { cookie: `bumdesma_session=${wrongSecret}` });
    assert.equal(forged.status, 401, "token dengan secret lain harus 401");

    // 2. Tanpa tanda tangan (alg: none).
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "none", typ: "JWT" })}.${encode({
      sub: "1",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.`;
    const noneResult = await request("/api/auth/me", {
      cookie: `bumdesma_session=${unsigned}`,
    });
    assert.equal(noneResult.status, 401, "token alg:none harus 401");
  });
});

/* -------------------------------------------------- uji yang butuh admin ---- */

describe("Uji keamanan API dengan kredensial admin", { skip: skipWhenApiDown || (ADMIN_EMAIL && ADMIN_PASSWORD ? false : SKIP_WITHOUT_ADMIN) }, () => {
  let adminCookie = "";
  let adminId = null;
  let editor = null;
  let editorCookie = "";
  let articleId = null;
  let formatArticleId = null;
  let partialArticleId = null;

  // Endpoint admin memakai id numerik, jadi artikel uji dicari lewat daftar.
  async function findArticleIdBySlug(slug) {
    const list = await request("/api/admin/articles?limit=500", { cookie: adminCookie });
    return list.data?.articles?.find((item) => item.slug === slug)?.id ?? null;
  }

  before(async () => {
    const result = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    adminCookie = sessionCookie(result.response);
    adminId = result.data.user.id;

    const created = await request("/api/admin/users", {
      method: "POST",
      cookie: adminCookie,
      body: {
        name: "Editor Uji Keamanan",
        email: `zz-uji-${randomUUID()}@localhost.test`,
        password: randomBytes(24).toString("base64url"),
        role: "editor",
      },
    });
    assert.equal(created.status, 201, "gagal membuat pengguna editor sementara");
    editor = { ...created.data.user, password: randomBytes(24).toString("base64url") };

    const updated = await request(`/api/admin/users/${editor.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { password: editor.password },
    });
    assert.equal(updated.status, 200, "gagal menyetel password editor sementara");

    const editorLogin = await login(editor.email, editor.password);
    editorCookie = sessionCookie(editorLogin.response);
  });

  after(async () => {
    if (editor?.id && adminCookie) {
      await request(`/api/admin/users/${editor.id}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
    }

    const id = articleId ?? (await findArticleIdBySlug(ARTICLE_SLUG));
    if (id && adminCookie) {
      await request(`/api/admin/articles/${id}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
    }

    const formatId = formatArticleId ?? (await findArticleIdBySlug(FORMAT_SLUG));
    if (formatId && adminCookie) {
      await request(`/api/admin/articles/${formatId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
    }

    const partialId = partialArticleId ?? (await findArticleIdBySlug(PARTIAL_SLUG));
    if (partialId && adminCookie) {
      await request(`/api/admin/articles/${partialId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
    }
  });

  it("token HS512 dengan secret server tetap ditolak (algoritma dipatok)", async (t) => {
    // Secret hanya dibaca dari env proses ini dan tidak pernah dicetak.
    if (!JWT_SECRET) {
      t.skip("JWT_SECRET tidak ada di env proses ini, uji algoritma dilewati.");
      return;
    }

    // Pastikan dulu secret di env uji memang sama dengan secret server.
    const hs256 = jwt.sign({ sub: String(adminId), role: "admin" }, JWT_SECRET, {
      algorithm: "HS256",
    });
    const accepted = await request("/api/auth/me", { cookie: `bumdesma_session=${hs256}` });
    if (accepted.status !== 200) {
      t.skip("Secret di env uji tidak sama dengan secret server, uji algoritma dilewati.");
      return;
    }

    const hs512 = jwt.sign({ sub: String(adminId), role: "admin" }, JWT_SECRET, {
      algorithm: "HS512",
    });
    const rejected = await request("/api/auth/me", { cookie: `bumdesma_session=${hs512}` });
    assert.equal(rejected.status, 401, "HS512 dengan secret server harus ditolak");
  });

  it("sesi editor tetap berlaku untuk artikelnya sendiri (200)", async () => {
    const result = await request("/api/admin/articles", { cookie: editorCookie });
    assert.equal(result.status, 200);
  });

  it("editor menerima 403 pada kategori, pengguna, dan konten situs", async () => {
    for (const pathname of [
      "/api/admin/categories",
      "/api/admin/users",
      "/api/admin/site-content",
    ]) {
      const result = await request(pathname, { cookie: editorCookie });
      assert.equal(result.status, 403, `${pathname} harus 403 untuk editor`);
    }
  });

  it("editor menerima 403 pada endpoint backup", async () => {
    const download = await request("/api/admin/backup/download", {
      cookie: editorCookie,
    });
    assert.equal(download.status, 403, "unduh backup harus 403 untuk editor");

    const restore = await request("/api/admin/backup/restore", {
      method: "POST",
      cookie: editorCookie,
      raw: true,
      body: new FormData(),
    });
    assert.equal(restore.status, 403, "pulihkan backup harus 403 untuk editor");
  });

  it("editor tidak dapat menerbitkan artikel (403)", async () => {
    const result = await request("/api/admin/articles", {
      method: "POST",
      cookie: editorCookie,
      body: {
        title: "Uji terbit oleh editor",
        slug: "zz-uji-editor-terbit",
        contentHtml: "<p>uji</p>",
        status: "published",
      },
    });
    assert.equal(result.status, 403);
  });

  it("password pengguna lebih dari 72 byte ditolak saat dibuat (400)", async () => {
    const result = await request("/api/admin/users", {
      method: "POST",
      cookie: adminCookie,
      body: {
        name: "Uji Password Panjang",
        email: `zz-uji-${randomUUID()}@localhost.test`,
        password: "a".repeat(73),
        role: "editor",
      },
    });
    assert.equal(result.status, 400);
    assert.match(result.data.message, /72/);
  });

  it("ganti password dengan password saat ini yang salah tetap 400, bukan 401", async () => {
    const result = await request("/api/auth/change-password", {
      method: "POST",
      cookie: editorCookie,
      body: {
        currentPassword: "password-yang-salah-sekali",
        newPassword: "PasswordBaru123",
      },
    });
    // 400 penting: 401 akan membuat frontend mengira sesi berakhir lalu
    // mengalihkan pengguna ke halaman login.
    assert.equal(result.status, 400);
    assert.equal(result.data.message, "Password saat ini salah.");
  });

  it("ganti password menolak password baru yang tidak valid (400)", async () => {
    const cases = [
      {
        body: { currentPassword: editor.password, newPassword: "pendek7" },
        pattern: /minimal 8 karakter/i,
      },
      {
        body: { currentPassword: editor.password, newPassword: "a".repeat(73) },
        pattern: /72 byte/i,
      },
      {
        body: { currentPassword: editor.password, newPassword: editor.password },
        pattern: /tidak boleh sama/i,
      },
    ];

    for (const item of cases) {
      const result = await request("/api/auth/change-password", {
        method: "POST",
        cookie: editorCookie,
        body: item.body,
      });
      assert.equal(result.status, 400, `harus 400 untuk ${item.pattern}`);
      assert.match(result.data.message, item.pattern);
    }
  });

  it("ganti password berhasil dan hanya cookie baru yang berlaku", async () => {
    const oldCookie = editorCookie;
    const oldPassword = editor.password;
    const newPassword = randomBytes(24).toString("base64url");

    const result = await request("/api/auth/change-password", {
      method: "POST",
      cookie: oldCookie,
      body: { currentPassword: oldPassword, newPassword },
    });
    assert.equal(result.status, 200, "ganti password harus berhasil");
    assert.equal(result.data.message, "Password berhasil diubah.");
    assert.doesNotMatch(
      JSON.stringify(result.data),
      /password_?hash|\$2[aby]\$/i,
      "respons tidak boleh memuat password atau hash",
    );

    const freshCookie = sessionCookie(result.response);

    const stale = await request("/api/auth/me", { cookie: oldCookie });
    assert.equal(stale.status, 401, "cookie lama harus ditolak setelah password diubah");

    const fresh = await request("/api/auth/me", { cookie: freshCookie });
    assert.equal(fresh.status, 200, "cookie baru dari respons harus tetap berlaku");
    assert.equal(fresh.data.user.id, editor.id);

    // Sesi pengujian berikutnya memakai password dan cookie yang baru.
    editor.password = newPassword;
    editorCookie = freshCookie;
  });

  it("sesi lama berakhir setelah password diubah (401)", async () => {
    // `iat` pada JWT hanya berpresisi detik, jadi tunggu sampai detik berikutnya
    // sebelum password diganti agar token lama benar-benar lebih tua.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const newPassword = randomBytes(24).toString("base64url");
    const changed = await request(`/api/admin/users/${editor.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { password: newPassword },
    });
    assert.equal(changed.status, 200);

    const stale = await request("/api/admin/articles", { cookie: editorCookie });
    assert.equal(stale.status, 401, "token lama harus ditolak setelah password berubah");

    const fresh = await login(editor.email, newPassword);
    assert.equal(sessionCookie(fresh.response).startsWith("bumdesma_session="), true);
  });

  it("konten berbahaya dari editor tersimpan dalam bentuk yang sudah dibersihkan", async () => {
    const created = await request("/api/admin/articles", {
      method: "POST",
      cookie: adminCookie,
      body: {
        title: "Uji sanitasi HTML",
        slug: ARTICLE_SLUG,
        excerpt: "Uji sanitasi",
        contentHtml: XSS_PAYLOADS.join("\n"),
        status: "published",
      },
    });
    // Artikel bisa saja tertinggal dari jalannya uji sebelumnya; hapus dulu.
    if (created.status === 409) {
      const staleId = await findArticleIdBySlug(ARTICLE_SLUG);
      assert.ok(staleId, "artikel uji lama harus bisa ditemukan untuk dihapus");
      await request(`/api/admin/articles/${staleId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
      const retry = await request("/api/admin/articles", {
        method: "POST",
        cookie: adminCookie,
        body: {
          title: "Uji sanitasi HTML",
          slug: ARTICLE_SLUG,
          excerpt: "Uji sanitasi",
          contentHtml: XSS_PAYLOADS.join("\n"),
          status: "published",
        },
      });
      assert.equal(retry.status, 201, "gagal membuat artikel uji sanitasi");
      articleId = retry.data.id;
    } else {
      assert.equal(created.status, 201, "gagal membuat artikel uji sanitasi");
      articleId = created.data.id;
    }

    const detail = await request(`/api/articles/${ARTICLE_SLUG}`);
    assert.equal(detail.status, 200);
    const html = detail.data.article.contentHtml;

    assert.doesNotMatch(html, /onerror/i, "atribut onerror harus hilang");
    assert.doesNotMatch(html, /javascript:/i, "skema javascript: harus hilang");
    assert.doesNotMatch(html, /evil\.example/i, "gambar dari domain luar harus dibuang");
    assert.doesNotMatch(html, /<script/i, "tag script harus hilang");
  });

  it("format teks yang diizinkan bertahan dan gaya berbahaya dibuang", async () => {
    const contentHtml = [
      // Format yang dipakai toolbar editor: rata tengah, font, ukuran, warna.
      '<p style="text-align: center"><span style=\'font-family: &quot;Times New Roman&quot;; font-size: 24px; color: #b91c1c\'>Teks berformat</span></p>',
      '<p><mark style="background-color: #fef08a; color: inherit">Teks disorot</mark></p>',
      '<h3 style="text-align: justify">Subjudul rata kanan kiri</h3>',
      // Gaya yang harus dibuang seluruhnya.
      '<p style="background:url(javascript:alert(1))">latar</p>',
      '<p style="position:fixed">posisi</p>',
      '<p><span style="font-family: Comic Sans MS">font asing</span></p>',
      '<p><span style="font-size: 13px">ukuran asing</span></p>',
      '<p style="color: red">warna nama</p>',
      '<img src=x onerror=alert(1)>',
      "<script>alert(1)</script>",
    ].join("");

    const payload = {
      title: "Uji format teks",
      slug: FORMAT_SLUG,
      excerpt: "Uji format teks",
      contentHtml,
      status: "published",
    };

    let created = await request("/api/admin/articles", {
      method: "POST",
      cookie: adminCookie,
      body: payload,
    });
    // Artikel bisa saja tertinggal dari jalannya uji sebelumnya; hapus dulu.
    if (created.status === 409) {
      const staleId = await findArticleIdBySlug(FORMAT_SLUG);
      assert.ok(staleId, "artikel uji lama harus bisa ditemukan untuk dihapus");
      await request(`/api/admin/articles/${staleId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
      created = await request("/api/admin/articles", {
        method: "POST",
        cookie: adminCookie,
        body: payload,
      });
    }
    assert.equal(created.status, 201, "gagal membuat artikel uji format teks");
    formatArticleId = created.data.id;

    const detail = await request(`/api/articles/${FORMAT_SLUG}`);
    assert.equal(detail.status, 200);
    const html = detail.data.article.contentHtml;

    // (a) Format yang diizinkan tersimpan apa adanya.
    assert.match(html, /text-align:\s*center/, "rata tengah harus bertahan");
    assert.match(html, /text-align:\s*justify/, "rata kanan kiri harus bertahan");
    assert.match(html, /Times New Roman/, "font yang diizinkan harus bertahan");
    assert.match(html, /font-size:\s*24px/, "ukuran font harus bertahan");
    assert.match(html, /color:\s*#b91c1c/i, "warna teks harus bertahan");
    assert.match(html, /<mark/, "sorotan harus bertahan");
    assert.match(html, /background-color:\s*#fef08a/i, "warna sorotan harus bertahan");
    assert.match(html, /<span/, "span format harus bertahan");

    // (b) Style berbahaya dibuang seluruhnya.
    assert.doesNotMatch(html, /javascript:/i, "url javascript harus hilang");
    assert.doesNotMatch(html, /position/i, "properti position harus hilang");
    assert.doesNotMatch(html, /background\s*:/i, "properti background harus hilang");

    // (c) Nilai di luar whitelist dibuang.
    assert.doesNotMatch(html, /Comic Sans/i, "font di luar daftar harus hilang");
    assert.doesNotMatch(html, /13px/i, "ukuran di luar daftar harus hilang");
    assert.doesNotMatch(html, /color:\s*red/i, "nama warna CSS harus hilang");

    // (d) Muatan berbahaya tetap dibuang.
    assert.doesNotMatch(html, /onerror/i, "atribut onerror harus hilang");
    assert.doesNotMatch(html, /<script/i, "tag script harus hilang");
  });

  it("PUT parsial hanya mengubah field yang dikirim (excerpt dan isi tetap)", async () => {
    const excerpt = "Ringkasan awal yang harus tetap ada.";
    const contentHtml = "<p>Isi awal artikel.</p><p>Paragraf kedua.</p>";
    const payload = {
      title: "Uji PUT parsial",
      slug: PARTIAL_SLUG,
      excerpt,
      contentHtml,
      status: "published",
    };

    let created = await request("/api/admin/articles", {
      method: "POST",
      cookie: adminCookie,
      body: payload,
    });
    // Artikel bisa saja tertinggal dari jalannya uji sebelumnya; hapus dulu.
    if (created.status === 409) {
      const staleId = await findArticleIdBySlug(PARTIAL_SLUG);
      assert.ok(staleId, "artikel uji lama harus bisa ditemukan untuk dihapus");
      await request(`/api/admin/articles/${staleId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
      created = await request("/api/admin/articles", {
        method: "POST",
        cookie: adminCookie,
        body: payload,
      });
    }
    assert.equal(created.status, 201, "gagal membuat artikel uji PUT parsial");
    partialArticleId = created.data.id;

    const before = await request(`/api/admin/articles/${partialArticleId}`, {
      cookie: adminCookie,
    });
    assert.equal(before.status, 200);
    assert.equal(before.data.article.excerpt, excerpt);
    assert.match(before.data.article.contentHtml, /Paragraf kedua/);

    // Hanya title yang dikirim: excerpt dan contentHtml harus dibiarkan apa
    // adanya, bukan diisi "" oleh default skema validasi.
    const updated = await request(`/api/admin/articles/${partialArticleId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { title: "Judul baru" },
    });
    assert.equal(updated.status, 200, JSON.stringify(updated.data));

    const detail = await request(`/api/admin/articles/${partialArticleId}`, {
      cookie: adminCookie,
    });
    assert.equal(detail.status, 200);
    assert.equal(detail.data.article.title, "Judul baru", "title harus ikut berubah");
    assert.equal(
      detail.data.article.excerpt,
      excerpt,
      "excerpt tidak boleh terhapus oleh PUT parsial",
    );
    assert.equal(
      detail.data.article.contentHtml,
      before.data.article.contentHtml,
      "isi artikel tidak boleh terhapus oleh PUT parsial",
    );

    // UI editor (ArticleEditor.jsx) selalu mengirim semua field. Simpan penuh
    // seperti itu harus tetap mengganti seluruh isi seperti sebelumnya.
    const fullPayload = {
      title: "Judul setelah simpan penuh",
      slug: PARTIAL_SLUG,
      excerpt: "Ringkasan baru dari editor.",
      contentHtml: "<p>Isi baru dari editor.</p>",
      coverImageUrl: null,
      categoryId: null,
      status: "published",
    };
    const full = await request(`/api/admin/articles/${partialArticleId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: fullPayload,
    });
    assert.equal(full.status, 200, JSON.stringify(full.data));

    const afterSave = await request(`/api/admin/articles/${partialArticleId}`, {
      cookie: adminCookie,
    });
    assert.equal(afterSave.status, 200);
    assert.equal(afterSave.data.article.title, fullPayload.title);
    assert.equal(afterSave.data.article.excerpt, fullPayload.excerpt);
    assert.match(afterSave.data.article.contentHtml, /Isi baru dari editor/);
    assert.doesNotMatch(
      afterSave.data.article.contentHtml,
      /Paragraf kedua/,
      "simpan penuh dari editor harus menggantikan isi lama",
    );
  });

  it("pratinjau mengembalikan HTML tersanitasi dan tidak menulis artikel", async () => {
    // Jumlah artikel dicatat lebih dulu: pratinjau tidak boleh membuat/mengubah
    // artikel apa pun, termasuk yang belum disimpan.
    const before = await request("/api/admin/articles?limit=500", {
      cookie: adminCookie,
    });
    assert.equal(before.status, 200);
    const countBefore = before.data.articles.length;

    const preview = await request("/api/admin/articles/preview", {
      method: "POST",
      cookie: adminCookie,
      body: {
        contentHtml: [
          '<p><span style="font-size: 24px; color: #b91c1c">Teks pratinjau</span> <mark style="background-color: #fef08a">sorot</mark></p>',
          '<p style="text-align: center">Rata tengah</p>',
          "<img src=x onerror=alert(1)>",
          "<script>alert(1)</script>",
        ].join(""),
      },
    });

    assert.equal(preview.status, 200, "pratinjau harus berhasil untuk sesi admin");
    assert.match(preview.data.contentHtml, /Teks pratinjau/);
    assert.match(preview.data.contentHtml, /font-size:\s*24px/);
    assert.match(preview.data.contentHtml, /color:\s*#b91c1c/i);
    assert.match(preview.data.contentHtml, /<mark/);
    assert.match(preview.data.contentHtml, /text-align:\s*center/);
    assert.doesNotMatch(preview.data.contentHtml, /onerror/i);
    assert.doesNotMatch(preview.data.contentHtml, /<script/i);

    const after = await request("/api/admin/articles?limit=500", {
      cookie: adminCookie,
    });
    assert.equal(after.status, 200);
    assert.equal(
      after.data.articles.length,
      countBefore,
      "pratinjau tidak boleh menulis artikel baru",
    );
  });

  it("daftar artikel admin dibatasi limit dan membatasi nilai berlebih (400)", async () => {
    const ok = await request("/api/admin/articles?limit=5", { cookie: adminCookie });
    assert.equal(ok.status, 200);
    assert.ok(ok.data.articles.length <= 5);

    const tooBig = await request("/api/admin/articles?limit=5000", { cookie: adminCookie });
    assert.equal(tooBig.status, 400);
  });

  it("tanggapannya tidak di-cache oleh browser", async () => {
    const result = await request("/api/admin/articles", { cookie: adminCookie });
    assert.equal(result.headers.get("cache-control"), "no-store");
  });
});

/* ------------------------------------------------------------ uji backup --- */

// Limiter pemulihan dikunci per id pengguna (5 per 15 menit). Uji memakai admin
// sementara supaya beberapa kali jalan dalam 15 menit tidak saling mengunci.
describe("Uji backup dan pemulihan", { skip: skipWhenApiDown || (ADMIN_EMAIL && ADMIN_PASSWORD ? false : SKIP_WITHOUT_ADMIN) }, () => {
  let adminCookie = "";
  let backupCookie = "";
  let backupAdminId = null;
  let backupPassword = "";

  before(async () => {
    const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    adminCookie = sessionCookie(adminLogin.response);

    backupPassword = randomBytes(24).toString("base64url");
    const created = await request("/api/admin/users", {
      method: "POST",
      cookie: adminCookie,
      body: {
        name: "Admin Uji Backup",
        email: `zz-uji-backup-${randomUUID()}@localhost.test`,
        password: backupPassword,
        role: "admin",
      },
    });
    assert.equal(created.status, 201, "gagal membuat admin sementara untuk uji backup");
    backupAdminId = created.data.user.id;

    const adminBackupLogin = await login(created.data.user.email, backupPassword);
    backupCookie = sessionCookie(adminBackupLogin.response);
  });

  after(async () => {
    if (backupAdminId && adminCookie) {
      await request(`/api/admin/users/${backupAdminId}`, {
        method: "DELETE",
        cookie: adminCookie,
      });
    }
  });

  it("unduh backup mengembalikan zip yang tidak di-cache dan tanpa data pengguna", async () => {
    const response = await fetch(`${API_URL}/api/admin/backup/download`, {
      headers: { Cookie: backupCookie },
    });

    assert.equal(response.status, 200, "unduh backup harus 200 untuk admin");
    assert.equal(response.headers.get("content-type"), "application/zip");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(
      response.headers.get("content-disposition") || "",
      /attachment; filename="bumdesma-backup-\d{8}-\d{6}\.zip"/,
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    assert.equal(
      buffer.subarray(0, 2).toString("latin1"),
      "PK",
      "isi respons harus berupa arsip zip",
    );

    const data = await readZipDataJson(buffer);
    assert.equal(data.formatVersion, 1);
    assert.ok(Array.isArray(data.categories), "kategori harus berupa larik");
    assert.ok(Array.isArray(data.articles), "artikel harus berupa larik");
    assert.doesNotMatch(
      JSON.stringify(data),
      /password_?hash|\$2[aby]\$/i,
      "backup tidak boleh memuat password atau hash",
    );
  });

  it("pemulihan dengan password salah ditolak (400), bukan 401", async () => {
    const result = await withBackupZip([["data.json", backupData()]], (zipPath) =>
      restoreBackup(backupCookie, "password-yang-salah-sekali", zipPath),
    );

    // 401 akan membuat frontend mengira sesi berakhir lalu mengalihkan admin.
    assert.equal(result.status, 400);
    assert.equal(result.data.message, "Password salah.");
  });

  it("zip dengan nama entri yang menembus folder ditolak (400)", async () => {
    const result = await withBackupZip(
      [
        ["data.json", backupData()],
        ["uploads/../../evil.txt", "x"],
      ],
      (zipPath) => restoreBackup(backupCookie, backupPassword, zipPath),
    );

    assert.equal(result.status, 400, "entri bertraversal harus ditolak");
    assert.match(result.data.message, /aman|valid|rusak/i);
  });

  it("gambar dengan nama .jpg tetapi isi bukan gambar ditolak (400)", async () => {
    const result = await withBackupZip(
      [
        ["data.json", backupData()],
        [
          "uploads/0123456789abcdef0123456789abcdef.jpg",
          Buffer.from("ini bukan gambar sama sekali"),
        ],
      ],
      (zipPath) => restoreBackup(backupCookie, backupPassword, zipPath),
    );

    assert.equal(result.status, 400, "isi gambar palsu harus ditolak");
    assert.match(result.data.message, /gambar/i);
  });
});

/* --------------------------------------- uji destruktif (opt-in saja) ------ */

const destructiveSkip =
  process.env.ALLOW_DESTRUCTIVE_TESTS === "1"
    ? false
    : "Uji destruktif dilewati. Set ALLOW_DESTRUCTIVE_TESTS=1 dan jalankan hanya terhadap database percobaan.";

// Pemulihan mengganti seluruh artikel, kategori, dan konten situs. Uji ini hanya
// berjalan bila diminta secara eksplisit dan tidak boleh diarahkan ke database
// produksi.
describe(
  "Uji destruktif backup (mengganti seluruh data)",
  {
    skip:
      skipWhenApiDown ||
      (ADMIN_EMAIL && ADMIN_PASSWORD ? destructiveSkip : SKIP_WITHOUT_ADMIN),
  },
  () => {
    let adminCookie = "";
    let backupCookie = "";
    let backupAdminId = null;
    let backupPassword = "";
    let tempDir = "";

    before(async () => {
      const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      adminCookie = sessionCookie(adminLogin.response);

      backupPassword = randomBytes(24).toString("base64url");
      const created = await request("/api/admin/users", {
        method: "POST",
        cookie: adminCookie,
        body: {
          name: "Admin Uji Restore",
          email: `zz-uji-restore-${randomUUID()}@localhost.test`,
          password: backupPassword,
          role: "admin",
        },
      });
      assert.equal(created.status, 201, "gagal membuat admin sementara untuk uji restore");
      backupAdminId = created.data.user.id;

      const restoreLogin = await login(created.data.user.email, backupPassword);
      backupCookie = sessionCookie(restoreLogin.response);
    });

    after(async () => {
      if (backupAdminId && adminCookie) {
        await request(`/api/admin/users/${backupAdminId}`, {
          method: "DELETE",
          cookie: adminCookie,
        });
      }
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
    });

    it("round-trip memulihkan data dan HTML berbahaya ikut dibersihkan", async () => {
      const download = await fetch(`${API_URL}/api/admin/backup/download`, {
        headers: { Cookie: backupCookie },
      });
      assert.equal(download.status, 200);
      const original = Buffer.from(await download.arrayBuffer());
      const originalData = await readZipDataJson(original);

      tempDir = await mkdtemp(path.join(os.tmpdir(), "zz-uji-restore-"));
      const originalPath = path.join(tempDir, "original.zip");
      await writeFile(originalPath, original);

      // 1. Memulihkan backup yang baru diunduh mengembalikan jumlah yang sama.
      const roundTrip = await restoreBackup(backupCookie, backupPassword, originalPath);
      assert.equal(roundTrip.status, 200, JSON.stringify(roundTrip.data));
      assert.equal(roundTrip.data.counts.categories, originalData.counts.categories);
      assert.equal(roundTrip.data.counts.articles, originalData.counts.articles);
      assert.equal(roundTrip.data.counts.siteContent, originalData.counts.siteContent);

      // 2. Backup buatan dengan HTML berbahaya.
      const xssSlug = "zz-uji-restore-xss";
      const now = new Date().toISOString();
      const crafted = backupData({
        articles: [
          {
            title: "Uji Restore XSS",
            slug: xssSlug,
            excerpt: "Uji restore",
            contentHtml:
              '<p>Aman</p><script>alert(1)</script><img src=x onerror=alert(1)>',
            coverImageUrl: null,
            categorySlug: "zz-uji-backup",
            status: "published",
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
            authorEmail: null,
          },
        ],
      });

      await withBackupZip([["data.json", crafted]], async (zipPath) => {
        const result = await restoreBackup(backupCookie, backupPassword, zipPath);
        assert.equal(result.status, 200, JSON.stringify(result.data));
      });

      const detail = await request(`/api/articles/${xssSlug}`);
      assert.equal(detail.status, 200, "artikel hasil restore harus bisa dibaca publik");
      const html = detail.data.article.contentHtml;
      assert.doesNotMatch(html, /<script/i, "tag script harus hilang");
      assert.doesNotMatch(html, /onerror/i, "atribut onerror harus hilang");
      assert.match(html, /Aman/, "konten aman harus tetap ada");

      // 3. Kembalikan data semula dari backup awal.
      const restored = await restoreBackup(backupCookie, backupPassword, originalPath);
      assert.equal(restored.status, 200, JSON.stringify(restored.data));
    });
  },
);
