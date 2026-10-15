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
};

// Konstanta non-rahasia.
export const AUTH_COOKIE = "bumdesma_session";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari
export const BCRYPT_ROUNDS = 12;
export const serverDirPath = serverDir;
