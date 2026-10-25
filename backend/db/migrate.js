import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { poolConfig } from "./pool.js";

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

// Pool khusus migrasi, bukan pool aplikasi dari db/pool.js. statement_timeout
// dan query_timeout di poolConfig adalah batas untuk query aplikasi: migrasi
// yang lebih lambat (mis. menambah kolom pada tabel besar) tidak boleh terkena.
// `SET LOCAL statement_timeout = 0` hanya mematikan batas di sisi Postgres,
// sedangkan query_timeout adalah batas sisi klien pg dan tetap berlaku — itulah
// penyebab kegagalan "Query read timeout". Karena itu keduanya dibuang dari
// salinan poolConfig; koneksinya dibatasi satu (max: 1) karena migrasi selalu
// dijalankan berurutan.
const {
  statement_timeout: _statementTimeout,
  query_timeout: _queryTimeout,
  ...migrationPoolConfig
} = poolConfig;
const pool = new pg.Pool({ ...migrationPoolConfig, max: 1 });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const { rows } = await pool.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`- ${file} (sudah diterapkan, dilewati)`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      // Batas statement_timeout dari sisi server tetap dimatikan untuk transaksi
      // migrasi ini. Batas sisi klien (query_timeout) sudah tidak ada karena pool
      // migrasi di atas tidak mewarisinya dari poolConfig.
      await client.query("SET LOCAL statement_timeout = 0");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      appliedCount += 1;
      console.log(`+ ${file} diterapkan`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migrasi ${file} gagal: ${error.message}`);
    } finally {
      client.release();
    }
  }

  console.log(
    appliedCount > 0
      ? `${appliedCount} migrasi baru diterapkan.`
      : "Tidak ada migrasi baru.",
  );
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exit(1);
  });
