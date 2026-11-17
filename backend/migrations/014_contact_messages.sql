-- 014_contact_messages.sql — pesan dari formulir kontak situs publik.
-- Disimpan hanya setelah lolos validasi di routes/messages.js; honeypot yang
-- terisi tidak pernah sampai ke tabel ini. is_read dipakai panel admin untuk
-- menandai pesan yang sudah ditindaklanjuti.

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Kotak masuk selalu diurutkan dari pesan terbaru, dan paginasi memakai offset.
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at DESC);
