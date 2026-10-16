import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

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
      // Migrasi bisa memakan waktu lebih lama dari statement_timeout pool (10
      // detik), misalnya saat menambah kolom pada tabel besar. Batas itu hanya
      // relevan untuk query aplikasi, jadi dimatikan khusus transaksi migrasi.
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
