-- 009_article_revisions.sql — riwayat revisi artikel.
-- Setiap penyimpanan yang mengubah judul/ringkasan/isi/sampul menyimpan nilai
-- lama di sini, sehingga editor bisa melihat dan memulihkan versi sebelumnya.
-- Gambar yang masih dirujuk revisi tidak dihapus dari disk (services/uploads.js).

CREATE TABLE IF NOT EXISTS article_revisions (
  id serial PRIMARY KEY,
  article_id integer NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content_html text NOT NULL DEFAULT '',
  cover_image_url text,
  saved_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id_id
  ON article_revisions (article_id, id DESC);
