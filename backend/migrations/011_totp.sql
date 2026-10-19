-- 011_totp.sql — verifikasi dua langkah (TOTP) untuk login admin/editor.
-- totp_secret disimpan terenkripsi (AES-256-GCM), bukan base32 mentah.
-- totp_last_step mencegah kode yang sama dipakai dua kali (replay).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret text,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_last_step bigint;
