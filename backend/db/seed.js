import bcrypt from "bcrypt";
import { BCRYPT_ROUNDS, isPlaceholderValue } from "../config/env.js";
import { pool } from "./pool.js";

const ADMIN_NAME = "Administrator";

async function run() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi di backend/.env sebelum menjalankan seed.",
    );
  }

  // Password contoh dari .env.example tidak boleh menjadi kredensial admin
  // sungguhan: nilainya publik dan bisa dicoba siapa pun.
  if (isPlaceholderValue(password)) {
    throw new Error(
      "ADMIN_PASSWORD masih memakai nilai contoh dari .env.example. Isi password admin yang kuat sebelum menjalankan seed.",
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Hanya membuat user admin pertama; user yang sudah ada tidak ditimpa.
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email`,
    [ADMIN_NAME, email, passwordHash],
  );

  if (rows[0]) {
    console.log(`Admin pertama dibuat: ${rows[0].email} (id ${rows[0].id}).`);
  } else {
    console.log(`User ${email} sudah ada, seed dilewati.`);
  }
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exit(1);
  });
