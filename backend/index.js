import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

async function start() {
  // Cek koneksi database dulu supaya kesalahan konfigurasi terlihat saat start.
  await pool.query("SELECT 1");

  const server = app.listen(env.port, () => {
    console.log(`API BUMDESMA berjalan di http://localhost:${env.port}`);
    console.log(`CORS diizinkan untuk origin: ${env.clientOrigin}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} diterima, menutup server...`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(async (error) => {
  console.error("Server gagal dijalankan:", error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
