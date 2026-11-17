-- 015_article_views.sql — jumlah dibaca artikel, dihitung sendiri oleh situs
-- (tanpa pelacak pihak ketiga). Nilai hanya bertambah lewat
-- POST /api/articles/:slug/view untuk artikel yang sudah terbit.
-- Restore backup tidak menyertakan kolom ini karena backup memilih kolom
-- artikel secara eksplisit, sehingga artikel hasil pemulihan mulai dari 0.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
