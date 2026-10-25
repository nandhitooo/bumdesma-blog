-- 001_init.sql — tabel inti CMS: users, categories, articles
-- Migrasi lain (kalau ada) harus berupa file baru di folder ini, bukan mengubah file yang sudah ada.

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS articles (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content_html text NOT NULL DEFAULT '',
  cover_image_url text,
  category_id integer REFERENCES categories(id) ON DELETE SET NULL,
  author_id integer REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_status_published_at
  ON articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);

CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles (author_id);
