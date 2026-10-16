-- 003_security.sql — pencabutan sesi setelah password berubah.
--
-- Token JWT berlaku 7 hari dan tidak bisa ditarik kembali; satu-satunya cara
-- membatalkannya adalah membandingkan waktu terbit token (iat) dengan waktu
-- password terakhir diubah.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz NOT NULL DEFAULT now();

-- Sesi yang sudah berjalan sebelum migrasi ini tetap valid: seluruh user yang
-- ada diberikan nilai jauh di masa lalu, sedangkan user baru memakai DEFAULT
-- now() sehingga token yang terbit sebelum perubahan password ditolak.
UPDATE users SET password_changed_at = 'epoch'::timestamptz;
