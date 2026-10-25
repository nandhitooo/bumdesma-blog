// Uji unit untuk services/totp.js. Tidak menyentuh database maupun HTTP, jadi
// bisa dijalankan tanpa server dan tanpa migrasi.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generate } from "otplib";
import {
  buildOtpauthUrl,
  decryptSecret,
  encryptSecret,
  generateSecret,
  verifyCode,
} from "../services/totp.js";

// services/totp.js menurunkan kunci dari env.jwtSecret saat dipakai. Nilai uji
// ini hanya dipakai bila backend/.env tidak menyediakan JWT_SECRET.
process.env.JWT_SECRET ||= "uji-totp-secret-yang-cukup-panjang-32";

const PERIOD_SECONDS = 30;

function currentEpoch() {
  return Math.floor(Date.now() / 1000);
}

async function codeAt(secret, epoch) {
  return generate({ secret, epoch });
}

describe("enkripsi secret TOTP", () => {
  it("enkripsi lalu dekripsi mengembalikan secret yang sama", () => {
    const secret = generateSecret();
    const payload = encryptSecret(secret);

    assert.match(payload, /^[^:]+:[^:]+:[^:]+$/);
    assert.doesNotMatch(payload, new RegExp(secret));
    assert.equal(decryptSecret(payload), secret);
  });

  it("payload yang diubah gagal didekripsi", () => {
    const secret = generateSecret();
    const [iv, tag, ciphertext] = encryptSecret(secret).split(":");

    // Ubah satu byte ciphertext tanpa memperbarui tag: autentikasi GCM harus
    // menolaknya, bukan mengembalikan teks yang salah.
    const bytes = Buffer.from(ciphertext, "base64");
    bytes[0] ^= 0xff;
    const tamperedCiphertext = [iv, tag, bytes.toString("base64")].join(":");
    assert.throws(() => decryptSecret(tamperedCiphertext));

    const tamperedTag = [iv, Buffer.alloc(16).toString("base64"), ciphertext].join(
      ":",
    );
    assert.throws(() => decryptSecret(tamperedTag));
  });
});

describe("verifikasi kode TOTP", () => {
  it("menerima kode yang dibuat otplib untuk secret tersebut", async () => {
    const secret = generateSecret();
    const code = await codeAt(secret, currentEpoch());

    const result = await verifyCode(secret, code);
    assert.equal(result.ok, true);
    assert.equal(typeof result.step, "number");
    assert.equal(
      result.step,
      Math.floor(currentEpoch() / PERIOD_SECONDS),
    );
  });

  it("menerima kode satu langkah sebelumnya (toleransi 30 detik)", async () => {
    const secret = generateSecret();
    const code = await codeAt(secret, currentEpoch() - PERIOD_SECONDS);

    const result = await verifyCode(secret, code);
    assert.equal(result.ok, true);
  });

  it("menolak kode acak", async () => {
    const secret = generateSecret();
    const now = currentEpoch();
    // Kumpulkan kode yang sah di sekitar waktu sekarang, lalu pilih kode 6
    // digit yang tidak ada di daftar itu supaya uji tidak bergantung keberuntungan.
    const valid = new Set();
    for (let offset = -2; offset <= 2; offset += 1) {
      valid.add(await codeAt(secret, now + offset * PERIOD_SECONDS));
    }
    let randomCode = "000000";
    for (let value = 0; value < 10; value += 1) {
      const candidate = String(value).padStart(6, "0");
      if (!valid.has(candidate)) {
        randomCode = candidate;
        break;
      }
    }

    const result = await verifyCode(secret, randomCode);
    assert.equal(result.ok, false);
    assert.equal(result.step, null);
  });

  it("menolak kode yang bukan 6 digit", async () => {
    const secret = generateSecret();
    const code = await codeAt(secret, currentEpoch());

    assert.equal((await verifyCode(secret, `${code}0`)).ok, false);
    assert.equal((await verifyCode(secret, "abcdef")).ok, false);
    assert.equal((await verifyCode(secret, "")).ok, false);
  });

  it("menolak kode yang sama setelah langkahnya dipakai (anti pakai ulang)", async () => {
    const secret = generateSecret();
    const code = await codeAt(secret, currentEpoch());

    const first = await verifyCode(secret, code);
    assert.equal(first.ok, true);

    const replay = await verifyCode(secret, code, { afterStep: first.step });
    assert.equal(replay.ok, false);
    assert.equal(replay.step, null);
  });
});

describe("URL otpauth", () => {
  it("memuat issuer, email, dan secret tanpa mengubah secret", () => {
    const secret = generateSecret();
    const url = buildOtpauthUrl("admin@contoh.id", secret);

    assert.match(url, /^otpauth:\/\/totp\//);
    assert.match(url, /issuer=BUMDESMA%20Podo%20Rukun/);
    assert.match(url, /admin%40contoh\.id/);
    assert.ok(url.includes(secret));
  });
});
