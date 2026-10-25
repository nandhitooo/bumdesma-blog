// Reset password user lewat CLI tanpa pengiriman email:
//   RESET_EMAIL=admin@contoh.id RESET_PASSWORD='password-baru' npm run reset-password
//
// Password dibaca dari environment, bukan argumen CLI, supaya tidak tersimpan
// di riwayat shell. Nilainya tidak pernah dicetak ke log.
import bcrypt from "bcrypt";
import { BCRYPT_ROUNDS, isPlaceholderValue } from "../config/env.js";
import { pool } from "./pool.js";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

async function run() {
  const email = (process.env.RESET_EMAIL || "").trim().toLowerCase();
  const password = process.env.RESET_PASSWORD || "";

  if (!email || !password) {
    throw new Error("RESET_EMAIL dan RESET_PASSWORD wajib diisi di environment.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`RESET_PASSWORD minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  // bcrypt hanya memakai 72 byte pertama, jadi password yang lebih panjang
  // harus ditolak agar tidak terpotong diam-diam.
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error(`RESET_PASSWORD maksimal ${MAX_PASSWORD_BYTES} byte.`);
  }
  if (isPlaceholderValue(password)) {
    throw new Error(
      "RESET_PASSWORD masih memakai nilai contoh. Isi password yang kuat.",
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // password_changed_at ikut diperbarui: requireAuth menolak token yang terbit
  // sebelum waktu ini, sehingga semua sesi lama langsung berakhir.
  const { rows } = await pool.query(
    `UPDATE users
     SET password_hash = $1, password_changed_at = now()
     WHERE lower(email) = $2
     RETURNING id`,
    [passwordHash, email],
  );

  if (!rows[0]) {
    throw new Error("User tidak ditemukan.");
  }

  console.log(
    `Password untuk ${email} berhasil direset. Semua sesi lama dicabut.`,
  );
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exit(1);
  });
