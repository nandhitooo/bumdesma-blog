-- 006_team_members.sql — susunan pengurus yang tampil di halaman publik.

CREATE TABLE IF NOT EXISTS team_members (
  id serial PRIMARY KEY,
  name text NOT NULL,
  position text NOT NULL,
  term_label text NOT NULL DEFAULT '',
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
