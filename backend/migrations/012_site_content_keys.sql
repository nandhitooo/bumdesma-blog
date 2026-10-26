-- Tabel site_content semula hanya mengizinkan lima key (hero, about, services,
-- contact, footer). Panel admin kini juga mengelola identitas situs (`site`) dan
-- judul tiap section/halaman (`sections`). Constraint lama dibuat tanpa nama di
-- 002, jadi namanya dicari dulu lalu diganti dengan versi yang mencakup 7 key.
DO $$
DECLARE
  existing_constraint text;
BEGIN
  FOR existing_constraint IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'site_content'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%''hero''%'
  LOOP
    EXECUTE format('ALTER TABLE site_content DROP CONSTRAINT %I', existing_constraint);
  END LOOP;
END $$;

ALTER TABLE site_content
  ADD CONSTRAINT site_content_key_check
  CHECK (key IN ('hero', 'about', 'services', 'contact', 'footer', 'site', 'sections'));
