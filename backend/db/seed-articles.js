// Data contoh untuk pengembangan, ganti dengan konten asli.
//
// Seed artikel contoh (idempotent):
//   npm run seed:articles               -> mengisi kategori + artikel contoh
//   node backend/db/seed-articles.js --force
//                                       -> tetap dijalankan walau NODE_ENV=production
//   Catatan: `npm run seed:articles -- --force` TIDAK meneruskan --force ke script,
//   karena npm memakai --force untuk dirinya sendiri; pakai `-- -- --force` bila
//   ingin lewat npm.
//
// Aman dijalankan berulang kali: kategori dan artikel memakai ON CONFLICT (slug)
// DO UPDATE, sehingga cover yang belum ada dapat diisi tanpa menimpa pilihan editor.
//
// Isi artikel sengaja hanya berupa gambaran umum kegiatan. Tidak ada nama orang,
// nominal, jumlah peserta, tanggal kejadian, atau kutipan yang dikarang. Angka
// dan legalitas yang dipakai hanya yang sudah ada di situs: program PPK/PNPM
// 2003-2014, dana Kecamatan Wilangan Rp 11.353.000.000, dan sertifikat badan
// hukum AHU-00115.AH.01.35.Tahun 2022.
import { cleanContent } from "../services/articles.js";
import { uploadDir } from "../services/uploads.js";
import { copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const FORCE = process.argv.includes("--force");
const MAX_EXCERPT_LENGTH = 300;
const photoDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/src/assets/kegiatan",
);

// Tag yang boleh dipakai di content_html; sisanya akan dibuang cleanContent.
const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "blockquote",
]);

// Urutan kategori mengikuti kategori yang memang dipakai halaman publik.
const CATEGORIES = [
  { name: "Internal", slug: "internal" },
  { name: "Event", slug: "event" },
  { name: "Sosial", slug: "sosial" },
  { name: "Edukasi", slug: "edukasi" },
  { name: "Bisnis", slug: "bisnis" },
  { name: "Gathering", slug: "gathering" },
];

// published_at memakai waktu tetap (WIB) supaya data contoh reproducible.
// Tanggal diambil dari spanduk/stempel foto bila terbaca; selain itu hanya
// tanggal contoh yang bisa diubah dari panel admin.
const ARTICLES = [
  {
    title: "Evaluasi Kegiatan BUMDesma Kabupaten Nganjuk Semester I 2023",
    slug: "evaluasi-kegiatan-bumdesma-kabupaten-nganjuk-semester-1-2023",
    photoIndex: 1,
    categorySlug: "internal",
    status: "published",
    publishedAt: "2023-07-11T15:00:00+07:00",
    excerpt:
      "Dinas Pemberdayaan Masyarakat dan Desa menggelar evaluasi kegiatan BUMDesma se-Kabupaten Nganjuk untuk semester I tahun 2023 pada Selasa, 11 Juli 2023.",
    contentHtml: `<p>Pada Selasa, 11 Juli 2023, Dinas Pemberdayaan Masyarakat dan Desa (PMD) Kabupaten Nganjuk menyelenggarakan Evaluasi Kegiatan BUMDesma Kabupaten Nganjuk Semester I Tahun 2023.</p>
<p>Forum ini mempertemukan pengelola BUMDesma dengan pihak dinas untuk meninjau perkembangan kegiatan selama enam bulan pertama tahun berjalan.</p>
<h2>Fokus Evaluasi</h2>
<ul>
  <li>Perkembangan kegiatan dan layanan tiap BUMDesma</li>
  <li>Kendala yang dihadapi pengelola di lapangan</li>
  <li>Arahan pembinaan dari dinas untuk semester berikutnya</li>
</ul>
<p>Hasil evaluasi menjadi bahan perbaikan bagi BUMDESMA Podo Rukun LKD dalam menyusun program dan pelaporan pada periode selanjutnya.</p>`,
  },
  {
    title: "Stan BUMDESMA Podo Rukun di Bazar Produk Desa",
    slug: "stan-bumdesma-podo-rukun-di-bazar-produk-desa",
    photoIndex: 2,
    categorySlug: "event",
    status: "published",
    publishedAt: "2023-08-05T10:00:00+07:00",
    excerpt:
      "Pengurus BUMDESMA Podo Rukun Kecamatan Wilangan membuka stan dalam bazar bersama Dinas PMD, menampilkan produk dan identitas lembaga kepada pengunjung.",
    contentHtml: `<p>BUMDESMA Podo Rukun Kecamatan Wilangan, Kabupaten Nganjuk, ikut berpartisipasi dalam bazar bersama Dinas PMD dengan membuka stan sendiri.</p>
<p>Stan dihias dengan balon, rangkaian bunga, dan spanduk lembaga, sementara pengurus yang mengenakan seragam lapangan menyambut pengunjung.</p>
<h2>Yang Ditampilkan</h2>
<ul>
  <li>Kaos bergambar identitas BUMDESMA yang dipajang pada manekin</li>
  <li>Spanduk dan materi informasi tentang lembaga</li>
  <li>Dekorasi stan bernuansa merah yang menarik perhatian pengunjung</li>
</ul>
<p>Bazar semacam ini menjadi sarana memperkenalkan BUMDESMA kepada masyarakat luas sekaligus mempererat jejaring dengan lembaga lain.</p>`,
  },
  {
    title: "Dolan Bareng Kelembagaan BUMDESMA Podo Rukun ke Semarang",
    slug: "dolan-bareng-kelembagaan-bumdesma-podo-rukun-ke-semarang",
    photoIndex: 3,
    categorySlug: "gathering",
    status: "published",
    publishedAt: "2021-12-04T18:00:00+07:00",
    excerpt:
      "Pada 4 Desember 2021, kelembagaan BUMDESMA Podo Rukun Kecamatan Wilangan berwisata bersama ke Semarang untuk mempererat kebersamaan antarpengurus dan pengelola.",
    contentHtml: `<p>Pada 4 Desember 2021, kelembagaan BUMDESMA Podo Rukun Kecamatan Wilangan menggelar kegiatan bertajuk Dolan Bareng dengan tujuan Semarang.</p>
<p>Peserta berfoto bersama di depan spanduk kegiatan dengan pose penuh semangat, mengenakan kaos seragam dan sebagian masih memakai masker sesuai protokol kesehatan saat itu.</p>
<h2>Makna Kegiatan</h2>
<p>Di luar urusan layanan dan pelaporan, kegiatan kebersamaan seperti ini menjaga keakraban antaranggota kelembagaan.</p>
<p>Hubungan kerja yang hangat membantu pengurus dan pengelola berkoordinasi lebih lancar dalam tugas sehari-hari.</p>`,
  },
  {
    title: "Musyawarah Antar Desa: Pertanggungjawaban Tahun Anggaran 2021",
    slug: "musyawarah-antar-desa-pertanggungjawaban-tahun-anggaran-2021",
    photoIndex: 4,
    categorySlug: "internal",
    status: "published",
    publishedAt: "2022-01-27T12:00:00+07:00",
    excerpt:
      "Musyawarah Antar Desa pada 27 Januari 2022 membahas pertanggungjawaban dan evaluasi BUMDesma Podo Rukun tahun anggaran 2021 serta perencanaan keuangan 2022.",
    contentHtml: `<p>Pada 27 Januari 2022, BUM Desa Bersama Podo Rukun Kecamatan Wilangan menyelenggarakan Musyawarah Antar Desa (MAD) di Wilangan.</p>
<p>Agenda utama musyawarah adalah pertanggungjawaban dan evaluasi kelembagaan BUMDesma Podo Rukun tahun anggaran 2021, dilanjutkan perencanaan keuangan tahun anggaran 2022.</p>
<h2>Jalannya Musyawarah</h2>
<ul>
  <li>Pengurus dan pejabat desa duduk di meja depan memimpin forum</li>
  <li>Perwakilan desa hadir sebagai peserta dan mengikuti paparan di layar proyektor</li>
  <li>Pembahasan dilakukan terbuka agar seluruh desa anggota memahami kondisi lembaga</li>
</ul>
<p>Kesepakatan dalam musyawarah menjadi acuan pelaksanaan program dan pengelolaan keuangan sepanjang tahun 2022.</p>`,
  },
  {
    title: "Penyaluran Bantuan Dana Sosial dari Surplus BUMDESMA",
    slug: "penyaluran-bantuan-dana-sosial-dari-surplus-bumdesma",
    photoIndex: 5,
    categorySlug: "sosial",
    status: "published",
    publishedAt: "2023-09-01T09:00:00+07:00",
    excerpt:
      "BUMDesa Bersama Podo Rukun menyalurkan bantuan dana sosial dari alokasi surplus usaha kepada warga di Kecamatan Wilangan bersama pemerintah desa.",
    contentHtml: `<p>BUMDesa Bersama Podo Rukun menyalurkan bantuan dana sosial yang bersumber dari alokasi surplus BUMDesa kepada warga di wilayah Kecamatan Wilangan pada tahun 2023.</p>
<p>Penyerahan dilakukan secara langsung. Seorang warga lanjut usia menerima bingkisan bantuan dari pengurus BUMDESMA, disaksikan perangkat desa yang hadir mendampingi.</p>
<h2>Dari Usaha untuk Warga</h2>
<p>Sebagian hasil usaha lembaga memang dialokasikan bagi kepentingan sosial, sehingga manfaat BUMDESMA dirasakan juga oleh warga yang membutuhkan.</p>
<p>Dokumentasi penyaluran disimpan sebagai bagian dari pertanggungjawaban kepada desa dan masyarakat.</p>`,
  },
  {
    title: "Pembinaan Kelompok SPP dan UEP Unit DBM Wilangan",
    slug: "pembinaan-kelompok-spp-uep-unit-dbm-wilangan",
    photoIndex: 6,
    categorySlug: "edukasi",
    status: "published",
    publishedAt: "2022-06-25T13:00:00+07:00",
    excerpt:
      "Pada 25 Juni 2022, BUMDesma Podo Rukun membina kelompok SPP dan UEP Unit Dana Bergulir Masyarakat di Kecamatan Wilangan dalam pertemuan santai lesehan.",
    contentHtml: `<p>BUMDesma Podo Rukun menggelar pembinaan kelompok Simpan Pinjam Perempuan (SPP) dan Usaha Ekonomi Produktif (UEP) Unit DBM di Kecamatan Wilangan pada 25 Juni 2022.</p>
<p>Pertemuan berlangsung lesehan dengan suasana akrab. Para narasumber duduk berjajar di depan spanduk kegiatan, dan salah satunya menyampaikan materi menggunakan pengeras suara.</p>
<h2>Tujuan Pembinaan</h2>
<ul>
  <li>Menguatkan pemahaman kelompok tentang pengelolaan pinjaman</li>
  <li>Menjaga ketertiban angsuran dan administrasi kelompok</li>
  <li>Membuka ruang tanya jawab antara pengelola dan anggota</li>
</ul>
<p>Pembinaan berkala seperti ini membantu kelompok tetap sehat dan usaha anggota terus berkembang.</p>`,
  },
  {
    title: "Rapat Koordinasi Pengurus BUMDESMA Podo Rukun 2023",
    slug: "rapat-koordinasi-pengurus-bumdesma-podo-rukun-2023",
    photoIndex: 7,
    categorySlug: "internal",
    status: "published",
    publishedAt: "2023-09-18T14:00:00+07:00",
    excerpt:
      "Pengurus BUMDESMA Podo Rukun Wilangan mengikuti rapat koordinasi pada 18 September 2023 bersama unsur pemerintahan di ruang pertemuan.",
    contentHtml: `<p>Pada 18 September 2023, pengurus BUMDESMA Podo Rukun Wilangan mengikuti rapat koordinasi yang berlangsung di sebuah ruang pertemuan.</p>
<p>Peserta duduk mengelilingi meja panjang dengan berkas, buku catatan, dan konsumsi tersedia. Rapat dihadiri pengurus berseragam biru serta perwakilan unsur pemerintahan.</p>
<h2>Suasana Rapat</h2>
<p>Papan tulis di ruangan memuat data calon DPT dan TPS pemilihan kepala desa serentak Kabupaten Nganjuk tahun 2023, menandakan banyaknya agenda tingkat desa yang dikoordinasikan pada periode tersebut.</p>
<p>Rapat koordinasi menjadi cara pengurus menyelaraskan jadwal dan kegiatan dengan pihak-pihak terkait.</p>`,
  },
  {
    title: "Launching PT LKM Artha Tanjung Mandiri dan Penggunaan BNI Direct",
    slug: "launching-pt-lkm-artha-tanjung-mandiri-dan-penggunaan-bni-direct",
    photoIndex: 8,
    categorySlug: "bisnis",
    status: "published",
    publishedAt: "2023-07-06T10:00:00+07:00",
    excerpt:
      "Peluncuran PT LKM Artha Tanjung Mandiri di Tanjunganom disertai pengenalan penggunaan BNI Direct dan rapat evaluasi semester I BUMDesma Mulia Mandiri LKD.",
    contentHtml: `<p>Di Kecamatan Tanjunganom digelar peluncuran PT LKM Artha Tanjung Mandiri yang dirangkaikan dengan penggunaan BNI Direct dan Rapat Evaluasi Semester 1 BUMDesma Mulia Mandiri LKD.</p>
<p>Spanduk kegiatan menampilkan logo mitra perbankan dan mitra pendukung, sedangkan para hadirin berpakaian batik berfoto bersama di depan panggung.</p>
<h2>Arti bagi Lembaga Keuangan Desa</h2>
<ul>
  <li>Layanan keuangan mikro yang lebih terstruktur melalui badan usaha berbentuk PT</li>
  <li>Transaksi perbankan berbasis aplikasi yang lebih mudah dan tercatat</li>
  <li>Kesempatan belajar antar-BUMDesma lewat forum evaluasi semester</li>
</ul>
<p>Kegiatan ini menjadi gambaran arah pengembangan layanan keuangan BUMDESMA di Kabupaten Nganjuk.</p>`,
  },
  {
    title: "Bimtek Aplikasi Laporan Keuangan Asosiasi BUMDesma Cluster 4",
    slug: "bimtek-aplikasi-laporan-keuangan-asosiasi-bumdesma-cluster-4",
    photoIndex: 9,
    categorySlug: "edukasi",
    status: "published",
    publishedAt: "2022-12-01T09:00:00+07:00",
    excerpt:
      "Asosiasi BUMDesma Kabupaten Nganjuk menggelar bimtek aplikasi laporan keuangan Cluster 4 di Wilangan untuk pengelola dari beberapa kecamatan.",
    contentHtml: `<p>Asosiasi BUMDesma Kabupaten Nganjuk menyelenggarakan Bimbingan Teknis (Bimtek) Aplikasi Laporan Keuangan Cluster 4 di Wilangan pada akhir tahun 2022.</p>
<p>Cluster 4 mencakup pengelola dari Kecamatan Wilangan, Gondang, Bejoso, dan Ngluyu, sehingga bimtek menjadi ajang bertemu sekaligus bertukar pengalaman antar-BUMDesma.</p>
<h2>Manfaat Bimtek</h2>
<ul>
  <li>Pengelola terbiasa memakai aplikasi pelaporan keuangan</li>
  <li>Format laporan lebih seragam antar-BUMDesma</li>
  <li>Kesalahan pencatatan dapat dibahas dan diperbaiki bersama</li>
</ul>
<p>Peserta berfoto bersama di akhir kegiatan di depan spanduk asosiasi.</p>`,
  },
  {
    title: "Verifikasi Data Penyaluran Bantuan Sosial di Kantor Pengelola",
    slug: "verifikasi-data-penyaluran-bantuan-sosial-di-kantor-pengelola",
    photoIndex: 10,
    categorySlug: "sosial",
    status: "published",
    publishedAt: "2022-07-14T10:00:00+07:00",
    excerpt:
      "Pengurus dan pengelola BUMDESMA Podo Rukun LKD memeriksa daftar penerima di kantor pengelola sebagai persiapan penyaluran bantuan sosial bagi masyarakat.",
    contentHtml: `<p>Di kantor pengelola BUMDESMA Podo Rukun LKD, pengurus dan staf berkumpul di sekeliling meja untuk memeriksa lembar daftar penerima sebelum penyaluran bantuan sosial bagi masyarakat.</p>
<p>Spanduk Penyaluran Bantuan Sosial terpasang di belakang meja, dan dinding ruangan dipenuhi foto dokumentasi kegiatan lembaga.</p>
<h2>Tahap Persiapan</h2>
<ul>
  <li>Membaca dan mencocokkan data pada formulir</li>
  <li>Mencatat hal-hal yang perlu dikoreksi</li>
  <li>Menyiapkan berkas untuk laporan penyaluran</li>
</ul>
<p>Pemeriksaan teliti pada tahap ini membuat bantuan sosial lebih tepat sasaran dan mudah dipertanggungjawabkan.</p>`,
  },
  {
    title: "Gerak Jalan Agustusan BUMDESMA Podo Rukun",
    slug: "gerak-jalan-agustusan-bumdesma-podo-rukun",
    photoIndex: 11,
    categorySlug: "event",
    status: "published",
    publishedAt: "2023-08-17T09:00:00+07:00",
    excerpt:
      "Pengurus dan pengelola BUMDESMA Podo Rukun ikut gerak jalan peringatan kemerdekaan dengan kaos putih, selempang bertuliskan nama lembaga, dan topi biru.",
    contentHtml: `<p>Pengurus dan pengelola BUMDESMA Podo Rukun ikut serta dalam gerak jalan dalam rangka memeriahkan peringatan hari kemerdekaan Indonesia.</p>
<p>Peserta tampil kompak dengan kaos putih, celana biru, topi biru, kacamata hitam, dan selempang merah putih bertuliskan nama lembaga. Sebagian mengacungkan jempol ke arah kamera.</p>
<h2>Kebersamaan di Hari Kemerdekaan</h2>
<p>Kegiatan gerak jalan menjadi sarana memperkenalkan BUMDESMA kepada warga di sepanjang rute sekaligus mempererat hubungan antarpengurus.</p>
<p>Dokumentasi ini melengkapi rangkaian kegiatan kebersamaan lembaga.</p>`,
  },
  {
    title: "Kebersamaan Tim BUMDESMA Podo Rukun di Pantai",
    slug: "kebersamaan-tim-bumdesma-podo-rukun-di-pantai",
    photoIndex: 12,
    categorySlug: "gathering",
    status: "published",
    publishedAt: "2022-10-22T09:00:00+07:00",
    excerpt:
      "Tim BUMDESMA Podo Rukun berfoto bersama di tepi pantai dengan kaos seragam bertuliskan One Team Dream dalam kegiatan kebersamaan lembaga.",
    contentHtml: `<p>Tim BUMDESMA Podo Rukun meluangkan waktu bersama di tepi pantai, berfoto di atas batu karang dengan latar laut dan bukit hijau.</p>
<p>Para peserta mengenakan kaos putih seragam bertuliskan One Team Dream, sebagian memakai kerudung motif senada dan kacamata hitam, dengan pose gembira yang kompak.</p>
<h2>Satu Tim, Satu Tujuan</h2>
<p>Tulisan pada kaos menjadi pengingat bahwa pekerjaan lembaga dijalankan sebagai satu tim.</p>
<p>Kegiatan di luar kantor seperti ini membantu menyegarkan suasana kerja dan menguatkan rasa kekeluargaan.</p>`,
  },
];

// Pemeriksaan sederhana supaya data contoh tetap sesuai batasan yang dijanjikan.
function assertArticlesAreValid() {
  for (const article of ARTICLES) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
      throw new Error(`Slug tidak valid: ${article.slug}`);
    }
    if (article.excerpt.length > MAX_EXCERPT_LENGTH) {
      throw new Error(
        `Excerpt "${article.slug}" ${article.excerpt.length} karakter, melebihi batas ${MAX_EXCERPT_LENGTH}.`,
      );
    }
    if (article.status === "published" && !article.publishedAt) {
      throw new Error(
        `Artikel terbit "${article.slug}" wajib punya publishedAt.`,
      );
    }
    if (
      !Number.isInteger(article.photoIndex) ||
      article.photoIndex < 1 ||
      article.photoIndex > 12
    ) {
      throw new Error(`Foto kegiatan tidak valid untuk "${article.slug}".`);
    }

    // Isi artikel harus 3-5 paragraf dan hanya memakai tag yang diizinkan. Tag di
    // luar daftar ini akan dibuang sanitize-html, jadi lebih baik ketahuan di sini.
    const paragraphs = (article.contentHtml.match(/<p>/g) || []).length;
    if (paragraphs < 3 || paragraphs > 5) {
      throw new Error(
        `Konten "${article.slug}" punya ${paragraphs} paragraf, harus 3-5.`,
      );
    }

    const usedTags = new Set(
      [...article.contentHtml.matchAll(/<([a-zA-Z0-9]+)/g)].map((match) =>
        match[1].toLowerCase(),
      ),
    );
    const unexpectedTags = [...usedTags].filter(
      (tag) => !ALLOWED_TAGS.has(tag),
    );
    if (unexpectedTags.length) {
      throw new Error(
        `Konten "${article.slug}" memakai tag di luar daftar: ${unexpectedTags.join(", ")}.`,
      );
    }
  }
}

async function copyActivityPhotos() {
  await mkdir(uploadDir, { recursive: true });
  const coversBySlug = new Map();
  const copiedPhotos = new Set();

  for (const article of ARTICLES) {
    const photoIndex = article.photoIndex;
    const filename = `00000000-0000-4000-8000-${String(photoIndex).padStart(12, "0")}.jpg`;
    const source = path.join(photoDir, `kegiatan${photoIndex}.jpg`);
    const destination = path.join(uploadDir, filename);

    if (!copiedPhotos.has(photoIndex)) {
      try {
        await copyFile(source, destination, constants.COPYFILE_EXCL);
      } catch (error) {
        if (error.code === "EEXIST") {
          copiedPhotos.add(photoIndex);
        } else if (error.code === "ENOENT") {
          console.warn(
            `Foto kegiatan tidak ditemukan untuk "${article.slug}": ${source}`,
          );
          coversBySlug.set(article.slug, null);
          continue;
        } else {
          throw error;
        }
      }
      copiedPhotos.add(photoIndex);
    }

    coversBySlug.set(article.slug, `/uploads/${filename}`);
  }

  return coversBySlug;
}

function assertAllowedToRun() {
  if ((process.env.NODE_ENV || "development") === "production" && !FORCE) {
    throw new Error(
      "Seed artikel contoh tidak dijalankan karena NODE_ENV=production. " +
        "Kalau memang disengaja, jalankan `node backend/db/seed-articles.js --force` " +
        "(atau `npm run seed:articles -- -- --force`), karena npm memakai flag --force untuk dirinya sendiri.",
    );
  }
}

// Penulis artikel contoh: user dengan email ADMIN_EMAIL, kalau tidak ada maka
// admin pertama yang tersedia.
async function resolveAuthor(client) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (adminEmail) {
    const { rows } = await client.query(
      "SELECT id, role FROM users WHERE lower(email) = $1 LIMIT 1",
      [adminEmail],
    );
    if (rows[0]) return { ...rows[0], source: "ADMIN_EMAIL" };
  }

  const { rows } = await client.query(
    "SELECT id, role FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1",
  );
  if (rows[0]) return { ...rows[0], source: "admin pertama" };

  throw new Error(
    "Belum ada user di database. Jalankan `npm run seed` dulu untuk membuat admin pertama, lalu ulangi `npm run seed:articles`.",
  );
}

// Mengembalikan id kategori, baik yang baru dibuat maupun yang sudah ada.
async function ensureCategories(client) {
  const result = new Map();
  let inserted = 0;
  let skipped = 0;

  for (const category of CATEGORIES) {
    const created = await client.query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [category.name, category.slug],
    );

    if (created.rows[0]) {
      inserted += 1;
      result.set(category.slug, created.rows[0].id);
      continue;
    }

    const existing = await client.query(
      "SELECT id FROM categories WHERE slug = $1",
      [category.slug],
    );
    result.set(category.slug, existing.rows[0].id);
    skipped += 1;
  }

  return { idsBySlug: result, inserted, skipped };
}

async function insertArticles(client, author, categories, coversBySlug) {
  let inserted = 0;
  let updated = 0;
  let insertedPublished = 0;
  let insertedDraft = 0;

  for (const article of ARTICLES) {
    const publishedAt = article.publishedAt
      ? new Date(article.publishedAt)
      : null;

    const { rows } = await client.query(
      `INSERT INTO articles
         (title, slug, excerpt, content_html, cover_image_url, category_id,
          author_id, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE
       SET cover_image_url = COALESCE(articles.cover_image_url, EXCLUDED.cover_image_url)
       RETURNING id, (xmax = 0) AS inserted`,
      [
        article.title,
        article.slug,
        article.excerpt,
        cleanContent(article.contentHtml),
        coversBySlug.get(article.slug) ?? null,
        categories.idsBySlug.get(article.categorySlug),
        author.id,
        article.status,
        publishedAt,
      ],
    );

    if (rows[0].inserted) {
      inserted += 1;
      if (article.status === "published") insertedPublished += 1;
      else insertedDraft += 1;
    } else {
      updated += 1;
    }
  }

  return { inserted, updated, insertedPublished, insertedDraft };
}

async function run() {
  assertAllowedToRun();
  assertArticlesAreValid();
  const coversBySlug = await copyActivityPhotos();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const author = await resolveAuthor(client);
    const categories = await ensureCategories(client);
    const articles = await insertArticles(
      client,
      author,
      categories,
      coversBySlug,
    );

    await client.query("COMMIT");

    console.log(
      `Penulis artikel contoh: user id ${author.id} (${author.role}), sumber ${author.source}.`,
    );
    console.log(
      `Kategori: ${categories.inserted} dibuat, ${categories.skipped} dilewati (sudah ada).`,
    );
    console.log(
      `Artikel : ${articles.inserted} dibuat (${articles.insertedPublished} terbit, ${articles.insertedDraft} draf), ` +
        `${articles.updated} diperiksa; cover lama tetap dipertahankan.`,
    );

    if (articles.inserted === 0) {
      console.log("Tidak ada artikel baru: data contoh sudah ada di database.");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exit(1);
  });
