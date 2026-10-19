-- 004_gallery.sql — foto galeri publik beserta keterangan dan tanggal kegiatan.

CREATE TABLE IF NOT EXISTS gallery_items (
  id serial PRIMARY KEY,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  event_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
