-- 005_report_documents.sql — dokumen laporan (mis. pertanggungjawaban tahunan)
-- yang ditautkan ke penyimpanan eksternal, bukan diunggah ke server.

CREATE TABLE IF NOT EXISTS report_documents (
  id serial PRIMARY KEY,
  title text NOT NULL,
  year smallint NOT NULL,
  description text NOT NULL DEFAULT '',
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
