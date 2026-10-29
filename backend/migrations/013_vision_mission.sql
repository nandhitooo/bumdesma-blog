-- Visi & Misi sebelumnya menumpang di key `about` (teks visi & butir misi) dan
-- `sections.about` (judul serta label). Panel admin kini punya tab sendiri,
-- jadi isinya dipindah ke key `vision-mission` agar bisa disimpan dan
-- dikembalikan ke bawaan tanpa menyentuh profil lembaga.
--
-- Constraint key dari 012 dibuat dengan nama tetap, tetapi pencariannya tetap
-- memakai pola yang sama supaya migrasi ini aman bila nama constraint berbeda
-- (mis. hasil restore backup dari versi lama).
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
  CHECK (key IN ('hero', 'about', 'vision-mission', 'services', 'contact', 'footer', 'site', 'sections'));

-- Salin isi lama hanya bila sudah ada konten tersimpan. Pada instalasi baru
-- belum ada baris apa pun, sehingga nilai bawaan dari DEFAULTS yang berlaku.
INSERT INTO site_content (key, content)
SELECT
  'vision-mission',
  jsonb_build_object(
    'eyebrow', COALESCE(
      (SELECT content->'about'->>'visionEyebrow' FROM site_content WHERE key = 'sections'),
      'Arah Lembaga'
    ),
    'title', COALESCE(
      (SELECT content->'about'->>'visionTitle' FROM site_content WHERE key = 'sections'),
      'Visi & Misi'
    ),
    'visionLabel', COALESCE(
      (SELECT content->'about'->>'visionLabel' FROM site_content WHERE key = 'sections'),
      'Visi'
    ),
    'missionLabel', COALESCE(
      (SELECT content->'about'->>'missionLabel' FROM site_content WHERE key = 'sections'),
      'Misi'
    ),
    'vision', COALESCE(
      (SELECT content->>'vision' FROM site_content WHERE key = 'about'),
      'Menjadi penggerak ekonomi dan kemandirian desa di Kecamatan Wilangan melalui pengelolaan usaha bersama yang profesional, transparan, dan inovatif.'
    ),
    'missions', COALESCE(
      (SELECT content->'missions' FROM site_content WHERE key = 'about'),
      '[
        "Menyediakan layanan permodalan dan keuangan yang mudah dijangkau kelompok masyarakat desa.",
        "Mengelola unit usaha secara profesional dan inovatif demi kesejahteraan masyarakat.",
        "Menjaga keterbukaan melalui laporan dan dokumen yang dapat diakses publik.",
        "Mendampingi kelompok dan pelaku usaha desa melalui pembinaan berkala."
      ]'::jsonb
    )
  )
WHERE EXISTS (SELECT 1 FROM site_content WHERE key IN ('about', 'sections'))
  AND NOT EXISTS (SELECT 1 FROM site_content WHERE key = 'vision-mission');
