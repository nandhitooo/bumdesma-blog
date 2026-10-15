import pg from "pg";
import { env } from "../config/env.js";

// Query selalu memakai parameterized query ($1, $2, ...) — tidak pernah string concat.
export const pool = new pg.Pool({ connectionString: env.databaseUrl });

pool.on("error", (err) => {
  console.error("Kesalahan koneksi Postgres:", err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}
