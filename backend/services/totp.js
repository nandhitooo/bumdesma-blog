import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import {
  generateSecret as otpGenerateSecret,
  generateURI,
  verify as otpVerify,
} from "otplib";
import { env } from "../config/env.js";

// Kunci enkripsi diturunkan dari JWT_SECRET, bukan disimpan terpisah: dengan
// begitu tidak ada env var baru yang bisa lupa diisi saat deploy. Info HKDF
// memisahkan kunci ini dari pemakaian JWT_SECRET lain (domain separation).
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY_INFO = "bumdesma-totp";
const ENCRYPTION_KEY_BYTES = 32;
const IV_BYTES = 12;
const TOTP_ISSUER = "BUMDESMA Podo Rukun";
const OTP_PERIOD_SECONDS = 30;
const CODE_PATTERN = /^\d{6}$/;

function encryptionKey() {
  // hkdfSync mengembalikan ArrayBuffer; Buffer.from membuatnya bisa dipakai
  // createCipheriv/createDecipheriv.
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(env.jwtSecret, "utf8"),
      Buffer.alloc(0),
      ENCRYPTION_KEY_INFO,
      ENCRYPTION_KEY_BYTES,
    ),
  );
}

// Format tersimpan: iv:tag:ciphertext, semuanya base64. Tag ikut disimpan
// karena AES-GCM membutuhkannya saat dekripsi untuk memverifikasi integritas.
export function encryptSecret(secret) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(secret), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64"))
    .join(":");
}

export function decryptSecret(payload) {
  const parts = String(payload ?? "").split(":");
  if (parts.length !== 3) {
    throw new Error("Format secret TOTP tidak valid.");
  }
  const [iv, tag, ciphertext] = parts;
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateSecret() {
  return otpGenerateSecret();
}

export function buildOtpauthUrl(email, secret) {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
  });
}

// Toleransi satu langkah ke belakang dan ke depan (30 detik) untuk jam klien
// yang sedikit bergeser. Kode harus string 6 digit; nilai lain ditolak sebelum
// menyentuh otplib.
//
// afterStep dipakai untuk anti pakai ulang: otplib menolak kode dengan
// timeStep <= afterStep. Hasil selalu { ok, step } supaya pemanggil bisa
// menyimpan langkah terakhir tanpa perlu tahu bentuk asli hasil otplib.
export async function verifyCode(secret, code, { afterStep = null } = {}) {
  const token = typeof code === "string" ? code.trim() : "";
  if (!CODE_PATTERN.test(token)) {
    return { ok: false, step: null };
  }

  const options = {
    secret,
    token,
    epochTolerance: OTP_PERIOD_SECONDS,
  };
  if (afterStep !== null && afterStep !== undefined) {
    options.afterTimeStep = afterStep;
  }

  try {
    const result = await otpVerify(options);
    if (!result.valid) {
      return { ok: false, step: null };
    }
    return { ok: true, step: result.timeStep };
  } catch {
    // Secret rusak/tidak valid bukan alasan untuk membocorkan detail ke
    // pemanggil; anggap saja kode tidak cocok.
    return { ok: false, step: null };
  }
}
