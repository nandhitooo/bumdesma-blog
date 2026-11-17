// Uji validasi formulir kontak tanpa database: skema zod yang dipakai
// POST /api/messages dan pendeteksi honeypot-nya. Perilaku penyimpanan diuji
// lewat route karena butuh koneksi database.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createMessageSchema,
  isHoneypotFilled,
} from "../routes/messages.js";

const validMessage = {
  name: "Budi Santoso",
  email: "Budi@Example.com",
  phone: "081234567890",
  message: "Mohon informasi syarat pengajuan dana bergulir.",
};

function firstError(payload) {
  const result = createMessageSchema.safeParse(payload);
  assert.equal(result.success, false, "payload seharusnya ditolak");
  return result.error.issues[0].message;
}

describe("validasi pesan kontak", () => {
  it("menerima pesan lengkap dan menormalkan email", () => {
    const result = createMessageSchema.safeParse(validMessage);
    assert.equal(result.success, true, "pesan valid harus lolos");
    // Email disimpan huruf kecil supaya balasan ke alamat yang sama tidak
    // terlihat sebagai dua pengirim berbeda.
    assert.equal(result.data.email, "budi@example.com");
  });

  it("menerima pesan tanpa nomor telepon", () => {
    const { phone: _phone, ...withoutPhone } = validMessage;
    const result = createMessageSchema.safeParse(withoutPhone);
    assert.equal(result.success, true, "nomor telepon bersifat opsional");
  });

  it("menolak nama kosong", () => {
    assert.equal(
      firstError({ ...validMessage, name: "   " }),
      "Nama wajib diisi.",
    );
  });

  it("menolak alamat email yang tidak valid", () => {
    assert.equal(
      firstError({ ...validMessage, email: "bukan-email" }),
      "Format email tidak valid.",
    );
  });

  it("menolak pesan yang lebih pendek dari 10 karakter", () => {
    assert.equal(
      firstError({ ...validMessage, message: "halo" }),
      "Pesan minimal 10 karakter.",
    );
  });

  it("menolak pesan yang lebih panjang dari 2000 karakter", () => {
    assert.equal(
      firstError({ ...validMessage, message: "a".repeat(2001) }),
      "Pesan maksimal 2000 karakter.",
    );
  });

  it("menolak isi yang memuat tag HTML", () => {
    assert.equal(
      firstError({ ...validMessage, message: "<b>halo</b> saya ingin bertanya" }),
      "Pesan harus berupa teks biasa.",
    );
    assert.equal(
      firstError({ ...validMessage, name: "<script>alert(1)</script>" }),
      "Nama harus berupa teks biasa.",
    );
  });
});

describe("honeypot formulir kontak", () => {
  it("dianggap kosong bila tidak dikirim atau hanya berisi spasi", () => {
    assert.equal(isHoneypotFilled(undefined), false);
    assert.equal(isHoneypotFilled({}), false);
    assert.equal(isHoneypotFilled({ website: "" }), false);
    assert.equal(isHoneypotFilled({ website: "   " }), false);
  });

  it("dianggap terisi bila bot mengisinya", () => {
    assert.equal(isHoneypotFilled({ website: "https://spam.example" }), true);
    // Nilai selain string juga menandakan pengisi otomatis.
    assert.equal(isHoneypotFilled({ website: 1 }), true);
  });
});
