import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Semua konfigurasi hanya dibaca dari env var (backend/.env, di-gitignore).
dotenv.config({ path: path.join(serverDir, ".env"), quiet: true });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Env var ${name} belum diisi. Salin backend/.env.example menjadi backend/.env lalu lengkapi nilainya.`,
    );
  }
  return value.trim();
}

function stringEnv(name) {
  const value = process.env[name];
  return value ? value.trim() : "";
}

export const MIN_JWT_SECRET_LENGTH = 32;

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get port() {
    return Number(process.env.PORT || 4000);
  },
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get jwtSecret() {
    return requireEnv("JWT_SECRET");
  },
  get clientOrigin() {
    return requireEnv("CLIENT_ORIGIN");
  },
  // Di belakang reverse proxy (nginx, Railway, dsb.) Express perlu tahu hop
  // pertama supaya IP asli klien dipakai rate limiter. Kosong = nonaktif.
  // Nilai yang diterima: "true", "false", jumlah hop ("1"), atau nama subnet
  // yang dikenal Express ("loopback", "linklocal", "uniquelocal").
  get trustProxy() {
    const raw = stringEnv("TRUST_PROXY");
    if (!raw) return false;
    if (raw === "true") return true;
    if (raw === "false") return false;

    const hops = Number(raw);
    if (Number.isInteger(hops) && hops >= 0) return hops;
    return raw;
  },
};

// Konstanta non-rahasia.
export const AUTH_COOKIE = "bumdesma_session";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari
export const BCRYPT_ROUNDS = 12;
export const serverDirPath = serverDir;

/* -------------------------------------------------------------------------- */
/* Validasi env                                                               */
/* -------------------------------------------------------------------------- */

// Dikumpulkan sekaligus (bukan satu per satu) supaya saat start semua masalah
// konfigurasi terlihat dalam satu pesan, lalu server berhenti sebelum listen.
function collectEnvProblems() {
  const problems = [];

  const databaseUrl = stringEnv("DATABASE_URL");
  if (!databaseUrl) {
    problems.push("DATABASE_URL belum diisi.");
  } else if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    problems.push(
      "DATABASE_URL harus berupa URL postgresql:// (contoh: postgresql://user:password@localhost:5432/nama_database).",
    );
  }

  const jwtSecret = stringEnv("JWT_SECRET");
  if (!jwtSecret) {
    problems.push("JWT_SECRET belum diisi (buat dengan `openssl rand -hex 32`).");
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(
      `JWT_SECRET minimal ${MIN_JWT_SECRET_LENGTH} karakter, sekarang ${jwtSecret.length} karakter.`,
    );
  }

  const clientOrigin = stringEnv("CLIENT_ORIGIN");
  if (!clientOrigin) {
    problems.push("CLIENT_ORIGIN belum diisi (contoh: http://localhost:5173).");
  } else {
    let parsed = null;
    try {
      parsed = new URL(clientOrigin);
    } catch {
      parsed = null;
    }
    if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
      problems.push(
        "CLIENT_ORIGIN harus URL http(s) lengkap tanpa slash di akhir (contoh: http://localhost:5173).",
      );
    } else if (clientOrigin.endsWith("/")) {
      // Browser tidak pernah mengirim trailing slash pada header Origin,
      // sehingga nilainya tidak akan pernah cocok saat perbandingan CORS.
      problems.push("CLIENT_ORIGIN tidak boleh diakhiri slash.");
    }
  }

  return problems;
}

export function validateEnv() {
  const problems = collectEnvProblems();
  if (problems.length > 0) {
    throw new Error(
      `Konfigurasi env tidak valid (backend/.env):\n- ${problems.join("\n- ")}`,
    );
  }
}
