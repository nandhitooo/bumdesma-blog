import pg from "pg";
import { env } from "../config/env.js";

// Batas koneksi & waktu ditulis eksplisit supaya perilaku pool tidak bergantung
// pada default library: koneksi yang menganggur dilepas, koneksi yang tidak
// pernah siap gagal cepat, dan query yang menggantung dibatalkan Postgres.
export const poolConfig = {
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 10_000,
  query_timeout: 15_000,
};

// Query selalu memakai parameterized query ($1, $2, ...) — tidak pernah string concat.
export const pool = new pg.Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Kesalahan koneksi Postgres:", err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}
