-- 010_audit_logs.sql — catatan aktivitas panel admin.
-- Hanya menyimpan nama aksi, entitas, id, dan detail non-sensitif (mis. daftar
-- nama field yang diubah). Tidak ada isi artikel, password, hash, atau token.
-- Belum ada retensi/penghapusan otomatis; pembersihan dilakukan manual.

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);
