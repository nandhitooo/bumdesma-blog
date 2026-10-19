-- 007_service_details.sql — syarat dan alur pengajuan tiap unit usaha. Seluruh
-- isinya teks biasa (bukan HTML) yang dikelola admin lewat panel.

CREATE TABLE IF NOT EXISTS service_details (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  requirements jsonb NOT NULL DEFAULT '[]',
  steps jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
