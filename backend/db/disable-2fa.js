// Nonaktifkan verifikasi dua langkah lewat CLI, untuk pemulihan saat pengguna
// kehilangan aplikasi authenticator:
//   RESET_EMAIL=admin@contoh.id npm run disable-2fa
//
// Email dibaca dari environment, bukan argumen CLI, supaya tidak tersimpan di
// riwayat shell. Secret tidak pernah dicetak ke log.
import { pool } from "./pool.js";

async function run() {
  const email = (process.env.RESET_EMAIL || "").trim().toLowerCase();

  if (!email) {
    throw new Error("RESET_EMAIL wajib diisi di environment.");
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET totp_enabled = false, totp_secret = NULL, totp_last_step = NULL
     WHERE lower(email) = $1
     RETURNING id`,
    [email],
  );

  if (!rows[0]) {
    throw new Error("User tidak ditemukan.");
  }

  console.log(`Verifikasi dua langkah untuk ${email} berhasil dinonaktifkan.`);
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exit(1);
  });
