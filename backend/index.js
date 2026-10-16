import { env, validateEnv } from "./config/env.js";

// Keep-alive sedikit lebih panjang dari default load balancer umum, dan
// headersTimeout harus lebih besar dari keepAliveTimeout.
const KEEP_ALIVE_TIMEOUT_MS = 65_000;
const HEADERS_TIMEOUT_MS = 70_000;
const REQUEST_TIMEOUT_MS = 120_000;

// Batas maksimal menunggu koneksi ditutup sebelum proses dipaksa berhenti.
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start() {
  // Validasi semua env var wajib SEKALIGUS, sebelum modul lain dimuat. app.js
  // dan db/pool.js diimpor secara dinamis di bawah karena keduanya membaca env
  // var saat dimuat; kalau diimpor statis, kegagalan env akan muncul satu per
  // satu dari modul tersebut, bukan sebagai satu daftar masalah.
  validateEnv();

  const [{ default: app }, { pool }] = await Promise.all([
    import("./app.js"),
    import("./db/pool.js"),
  ]);

  // Cek koneksi database dulu supaya kesalahan konfigurasi terlihat saat start.
  await pool.query("SELECT 1");

  const server = app.listen(env.port, () => {
    console.log(`API BUMDESMA berjalan di http://localhost:${env.port}`);
    console.log(`CORS diizinkan untuk origin: ${env.clientOrigin}`);
  });

  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.requestTimeout = REQUEST_TIMEOUT_MS;

  let shuttingDown = false;

  const shutdown = (reason, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${reason} diterima, menutup server...`);

    // Kalau koneksi tidak kunjung tutup, proses tetap dihentikan agar tidak
    // menggantung selamanya saat deploy/migrasi.
    const forceExit = setTimeout(() => {
      console.error(
        `Server tidak selesai menutup dalam ${SHUTDOWN_TIMEOUT_MS} ms, proses dihentikan paksa.`,
      );
      process.exit(exitCode === 0 ? 1 : exitCode);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(() => {
      clearTimeout(forceExit);
      pool.end().finally(() => process.exit(exitCode));
    });

    // Koneksi keep-alive yang menganggur tidak menunggu timeout-nya habis.
    server.closeIdleConnections?.();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("Promise ditolak tanpa penanganan:", reason);
    shutdown("unhandledRejection", 1);
  });

  process.on("uncaughtException", (error) => {
    console.error("Exception tanpa penanganan:", error);
    shutdown("uncaughtException", 1);
  });
}

start().catch(async (error) => {
  console.error("Server gagal dijalankan:", error.message);
  process.exit(1);
});
