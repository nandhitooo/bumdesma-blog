CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY CHECK (key IN ('hero', 'about', 'services', 'contact', 'footer')),
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by integer REFERENCES users(id) ON DELETE SET NULL
);
