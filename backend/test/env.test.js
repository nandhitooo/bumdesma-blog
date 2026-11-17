// Uji validasi env, khususnya larangan URL publik berhost lokal saat produksi.
// Setiap skenario dijalankan di proses anak karena `config/env.js` membaca env
// var lewat getter, dan `dotenv` hanya mengisi nilai yang belum ada di
// process.env. Dengan mengirim semua variabel yang diperiksa secara eksplisit,
// isi backend/.env tidak pernah ikut menentukan hasil uji dan satu-satunya
// sumber error adalah aturan yang sedang diuji.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Folder backend, dipakai sebagai cwd proses anak supaya `./config/env.js` bisa
// diimpor relatif terhadap lokasi aslinya.
const backendDir = fileURLToPath(new URL("..", import.meta.url));

// Nilai palsu yang valid (bukan placeholder, bukan rahasia asli) supaya
// pemeriksaan DATABASE_URL, JWT_SECRET, dan TRUST_PROXY di collectEnvProblems()
// tidak ikut gagal.
const VALID_DATABASE_URL = "postgresql://uji:uji@127.0.0.1:5432/uji";
const VALID_JWT_SECRET = "a".repeat(48);

function runValidateEnv(scenarioEnv) {
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", 'import("./config/env.js").then((m) => m.validateEnv());'],
    {
      cwd: backendDir,
      env: {
        PATH: process.env.PATH,
        DATABASE_URL: VALID_DATABASE_URL,
        JWT_SECRET: VALID_JWT_SECRET,
        // Angka hop, bukan "true", supaya produksi tidak memicu error TRUST_PROXY.
        TRUST_PROXY: "1",
        ...scenarioEnv,
      },
      encoding: "utf8",
    },
  );
}

describe("validasi URL publik situs saat produksi", () => {
  it("menerima domain asli pada PUBLIC_SITE_URL", () => {
    const result = runValidateEnv({
      NODE_ENV: "production",
      PUBLIC_SITE_URL: "https://bumdesma.example.id",
      CLIENT_ORIGIN: "https://bumdesma.example.id",
    });

    assert.equal(result.status, 0, `validateEnv() harus lulus, stderr: ${result.stderr}`);
  });

  it("menolak PUBLIC_SITE_URL yang menunjuk host lokal", () => {
    const result = runValidateEnv({
      NODE_ENV: "production",
      PUBLIC_SITE_URL: "https://localhost",
      CLIENT_ORIGIN: "https://bumdesma.example.id",
    });

    assert.notEqual(result.status, 0, "validateEnv() harus melempar error");
    // https lolos pemeriksaan protokol, jadi error yang tersisa hanya soal host.
    assert.match(result.stderr, /host lokal/);
  });

  it("menolak fallback CLIENT_ORIGIN berhost lokal saat PUBLIC_SITE_URL kosong", () => {
    const result = runValidateEnv({
      NODE_ENV: "production",
      // String kosong tetap dianggap terisi oleh dotenv, jadi backend/.env tidak
      // bisa mengisi nilai ini dan getter publicSiteUrl memakai CLIENT_ORIGIN.
      PUBLIC_SITE_URL: "",
      CLIENT_ORIGIN: "http://localhost:5173",
    });

    assert.notEqual(result.status, 0, "validateEnv() harus melempar error");
    assert.match(result.stderr, /host lokal/);
  });

  it("menerima fallback CLIENT_ORIGIN saat PUBLIC_SITE_URL kosong", () => {
    const result = runValidateEnv({
      NODE_ENV: "production",
      PUBLIC_SITE_URL: "",
      CLIENT_ORIGIN: "https://bumdesma.example.id",
    });

    assert.equal(result.status, 0, `validateEnv() harus lulus, stderr: ${result.stderr}`);
  });
});

describe("validasi URL publik situs saat development", () => {
  it("tetap menerima localhost karena bukan produksi", () => {
    const result = runValidateEnv({
      NODE_ENV: "development",
      PUBLIC_SITE_URL: "",
      CLIENT_ORIGIN: "http://localhost:5173",
    });

    assert.equal(result.status, 0, `validateEnv() harus lulus, stderr: ${result.stderr}`);
  });
});
