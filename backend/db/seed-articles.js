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
// DO NOTHING, jadi baris yang sudah ada dilewati, bukan diduplikasi.
//
// Isi artikel sengaja hanya berupa gambaran umum kegiatan. Tidak ada nama orang,
// nominal, jumlah peserta, tanggal kejadian, atau kutipan yang dikarang. Angka
// dan legalitas yang dipakai hanya yang sudah ada di situs: program PPK/PNPM
// 2003-2014, dana Kecamatan Wilangan Rp 11.353.000.000, dan sertifikat badan
// hukum AHU-00115.AH.01.35.Tahun 2022.
import { cleanContent } from "../services/articles.js";
import { pool } from "./pool.js";

const FORCE = process.argv.includes("--force");
const MAX_EXCERPT_LENGTH = 300;

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
// Artikel terbit diurutkan dari yang terbaru; draf tidak punya published_at.
const ARTICLES = [
  {
    title: "Evaluasi Kinerja Tahunan BUMDesma Podo Rukun",
    slug: "evaluasi-kinerja-tahunan-bumdesma-podo-rukun",
    categorySlug: "internal",
    status: "published",
    publishedAt: "2026-09-28T08:00:00+07:00",
    excerpt:
      "Evaluasi kinerja tahunan menjadi momen meninjau capaian unit usaha sekaligus menyusun rencana kerja BUMDESMA Podo Rukun LKD periode berikutnya.",
    contentHtml: `<p>Evaluasi kinerja tahunan BUMDESMA Podo Rukun LKD dilaksanakan sebagai bagian dari tata kelola kelembagaan yang transparan dan akuntabel.</p>
<h2>Cakupan Penilaian</h2>
<p>Penilaian mencakup capaian setiap unit usaha, kualitas layanan kepada masyarakat, serta tertib administrasi dan pelaporan.</p>
<ul>
  <li>Capaian kinerja unit usaha dan layanan</li>
  <li>Kendala operasional yang dihadapi pengelola</li>
  <li>Rekomendasi perbaikan tata kelola</li>
</ul>
<h2>Tindak Lanjut</h2>
<p>Hasil evaluasi dipakai sebagai dasar penyusunan rencana kerja periode berikutnya, termasuk penguatan pencatatan dan pelaporan keuangan.</p>
<blockquote>Evaluasi dilakukan bersama pengurus dan perwakilan desa agar hasilnya dapat ditindaklanjuti bersama.</blockquote>`,
  },
  {
    title: "Musyawarah Antar Desa Membahas Program BUMDesma",
    slug: "musyawarah-antar-desa-membahas-program-bumdesma",
    categorySlug: "internal",
    status: "published",
    publishedAt: "2026-09-14T09:30:00+07:00",
    excerpt:
      "Musyawarah Antar Desa menjadi forum koordinasi antar pemerintah desa untuk menyelaraskan program dan layanan BUMDESMA Podo Rukun LKD.",
    contentHtml: `<p>Musyawarah Antar Desa (MAD) menjadi forum koordinasi antara pengelola BUMDESMA Podo Rukun LKD dan pemerintah desa di Kecamatan Wilangan.</p>
<h2>Agenda Pembahasan</h2>
<p>Forum ini membahas arah program, kebutuhan masyarakat, serta bentuk dukungan desa terhadap layanan yang dikelola bersama.</p>
<ol>
  <li>Penyampaian perkembangan program dan layanan</li>
  <li>Pembahasan usulan kegiatan dari tiap desa</li>
  <li>Penetapan kesepakatan tindak lanjut</li>
</ol>
<p>Kesepakatan yang dihasilkan menjadi acuan pelaksanaan kegiatan pada periode berikutnya.</p>`,
  },
  {
    title: "Penyaluran Bantuan Sosial bagi Warga Desa",
    slug: "penyaluran-bantuan-sosial-bagi-warga-desa",
    categorySlug: "sosial",
    status: "published",
    publishedAt: "2026-08-30T08:00:00+07:00",
    excerpt:
      "Penyaluran bantuan sosial dilakukan bersama pemerintah desa dengan mengutamakan ketepatan sasaran dan keterbukaan data penerima.",
    contentHtml: `<p>Penyaluran bantuan sosial bagi warga desa dilaksanakan bersama pemerintah desa agar sasaran penerima sesuai data yang disepakati.</p>
<p>Kegiatan ini mengedepankan ketepatan sasaran, keterbukaan informasi, dan pendampingan bagi warga penerima manfaat.</p>
<h2>Prinsip Pelaksanaan</h2>
<ul>
  <li>Data penerima disusun dan diverifikasi bersama pemerintah desa</li>
  <li>Penyaluran dilakukan secara terbuka dan terdokumentasi</li>
  <li>Warga penerima mendapat pendampingan setelah penyaluran</li>
</ul>
<p>Dokumentasi kegiatan disimpan sebagai bahan laporan pertanggungjawaban kepada desa dan masyarakat.</p>`,
  },
  {
    title: "Pembinaan Kelompok SPP dan UEP",
    slug: "pembinaan-kelompok-spp-dan-uep",
    categorySlug: "edukasi",
    status: "published",
    publishedAt: "2026-08-12T10:00:00+07:00",
    excerpt:
      "Pembinaan kelompok SPP dan UEP mendampingi warga mengembangkan usaha melalui pencatatan sederhana dan penguatan modal kelompok.",
    contentHtml: `<p>Pembinaan kelompok Simpan Pinjam Perempuan (SPP) dan Usaha Ekonomi Produktif (UEP) dilakukan secara berkala oleh pendamping BUMDESMA.</p>
<h2>Materi Pendampingan</h2>
<p>Pendampingan menekankan praktik sederhana yang bisa langsung diterapkan kelompok dalam kegiatan usaha sehari-hari.</p>
<ul>
  <li>Pencatatan transaksi dan kas kelompok</li>
  <li>Pengelolaan modal serta penentuan angsuran</li>
  <li>Penguatan kelembagaan dan pertemuan rutin kelompok</li>
</ul>
<p>Hasil pendampingan ditinjau kembali pada pertemuan berikutnya untuk memastikan perbaikan berjalan.</p>`,
  },
  {
    title: "Bimtek Aplikasi Laporan Keuangan",
    slug: "bimtek-aplikasi-laporan-keuangan",
    categorySlug: "edukasi",
    status: "published",
    publishedAt: "2026-07-29T09:00:00+07:00",
    excerpt:
      "Bimbingan teknis aplikasi laporan keuangan membekali pengelola unit usaha agar pencatatan transaksi lebih tertib dan mudah diperiksa.",
    contentHtml: `<p>Bimbingan teknis (bimtek) aplikasi laporan keuangan diikuti oleh pengelola unit usaha BUMDESMA Podo Rukun LKD.</p>
<h2>Materi Bimtek</h2>
<ol>
  <li>Pengenalan antarmuka dan alur kerja aplikasi</li>
  <li>Pencatatan transaksi harian dan pengelompokan akun</li>
  <li>Penyusunan laporan berkala</li>
  <li>Penelusuran dan perbaikan kesalahan pencatatan</li>
</ol>
<p>Peserta didampingi untuk menerapkan pencatatan tersebut pada transaksi harian unit usaha masing-masing.</p>
<p>Bimtek diakhiri dengan latihan mandiri agar peserta terbiasa memakai aplikasi pada pekerjaan sehari-hari.</p>`,
  },
  {
    title: "Bazar Produk Desa Mendorong Promosi Usaha Warga",
    slug: "bazar-produk-desa-mendorong-promosi-usaha-warga",
    categorySlug: "event",
    status: "published",
    publishedAt: "2026-07-11T09:00:00+07:00",
    excerpt:
      "Bazar produk desa menjadi ruang promosi produk unggulan warga sekaligus ajang memperkuat jejaring pelaku usaha lokal.",
    contentHtml: `<p>Bazar produk desa digelar sebagai ruang promosi produk unggulan masyarakat Kecamatan Wilangan.</p>
<p>Kegiatan ini mempertemukan pelaku usaha warga dengan pembeli, sehingga produk desa lebih dikenal di luar lingkungan sendiri.</p>
<h2>Tujuan Kegiatan</h2>
<ul>
  <li>Memperkenalkan produk unggulan dari tiap desa</li>
  <li>Membuka peluang kerja sama antar pelaku usaha</li>
  <li>Mendorong kemandirian ekonomi warga</li>
</ul>
<p>Evaluasi kegiatan dilakukan bersama peserta untuk menyusun perbaikan pada penyelenggaraan berikutnya.</p>`,
  },
  {
    title: "Layanan Dana Bergulir Masyarakat",
    slug: "layanan-dana-bergulir-masyarakat",
    categorySlug: "bisnis",
    status: "published",
    publishedAt: "2026-06-24T08:30:00+07:00",
    excerpt:
      "Layanan Dana Bergulir Masyarakat menyediakan pembiayaan usaha bagi kelompok warga dengan pendampingan yang berkelanjutan.",
    contentHtml: `<p>Layanan Dana Bergulir Masyarakat menjadi salah satu unit usaha BUMDESMA Podo Rukun LKD dalam mendukung permodalan warga.</p>
<h2>Alur Layanan</h2>
<p>Calon penerima menyampaikan pengajuan kepada pengelola, kemudian diproses sesuai ketentuan yang berlaku.</p>
<ul>
  <li>Pengajuan dan pemeriksaan kelengkapan berkas</li>
  <li>Penilaian kelayakan usaha dan kesepakatan angsuran</li>
  <li>Pendampingan penggunaan dana dan pembayaran angsuran</li>
</ul>
<p>Pendampingan dilakukan agar dana yang diterima benar-benar dipakai untuk mengembangkan usaha.</p>`,
  },
  {
    title: "Sejarah BUMDesma Podo Rukun dari PPK hingga PNPM",
    slug: "sejarah-bumdesma-podo-rukun-dari-ppk-hingga-pnpm",
    categorySlug: "internal",
    status: "published",
    publishedAt: "2026-06-05T09:00:00+07:00",
    excerpt:
      "Perjalanan BUMDESMA Podo Rukun LKD dimulai dari program pemberdayaan masyarakat yang berjalan sejak 2003 hingga 2014.",
    contentHtml: `<p>BUMDESMA Podo Rukun LKD tumbuh dari program pemberdayaan masyarakat yang berjalan bertahap, mulai dari Program Pengembangan Kecamatan (PPK) hingga Program Nasional Pemberdayaan Masyarakat (PNPM) pada 2003 sampai 2014.</p>
<p>Dana yang diterima Kecamatan Wilangan melalui rangkaian program tersebut tercatat mencapai <strong>Rp 11.353.000.000</strong>.</p>
<h2>Landasan Hukum</h2>
<p>BUMDesa Bersama PODO RUKUN LKD telah memperoleh pengesahan badan hukum melalui sertifikat <strong>AHU-00115.AH.01.35.Tahun 2022</strong> dari Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia.</p>
<p>Kantor pengelola berlokasi di Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Jawa Timur.</p>
<p>Perjalanan tersebut menjadi dasar pengembangan unit usaha dan layanan yang dikelola bersama oleh desa-desa anggota.</p>`,
  },
  {
    title: "Rencana Layanan Keagenan Bank di Kantor Pengelola",
    slug: "rencana-layanan-keagenan-bank-di-kantor-pengelola",
    categorySlug: "bisnis",
    status: "draft",
    publishedAt: null,
    excerpt:
      "Layanan keagenan bank membantu warga melakukan transaksi perbankan tanpa harus menempuh perjalanan jauh ke pusat kota.",
    contentHtml: `<p>Layanan keagenan bank menjadi salah satu layanan yang disiapkan BUMDESMA Podo Rukun LKD bagi masyarakat desa.</p>
<h2>Bentuk Layanan</h2>
<p>Melalui layanan ini, warga dapat melakukan transaksi perbankan dasar di kantor pengelola.</p>
<ul>
  <li>Setoran dan penarikan tunai</li>
  <li>Transfer antar rekening</li>
  <li>Pembayaran tagihan rutin</li>
</ul>
<p>Keberadaan layanan ini diharapkan menghemat waktu dan biaya perjalanan warga.</p>`,
  },
  {
    title: "Gerak Jalan Agustusan Warga Wilangan",
    slug: "gerak-jalan-agustusan-warga-wilangan",
    categorySlug: "gathering",
    status: "draft",
    publishedAt: null,
    excerpt:
      "Gerak jalan agustusan menjadi kegiatan kebersamaan warga yang rutin digelar untuk memeriahkan hari kemerdekaan.",
    contentHtml: `<p>Gerak jalan agustusan menjadi salah satu kegiatan yang dinantikan warga desa.</p>
<p>Kegiatan ini digelar untuk memeriahkan hari kemerdekaan sekaligus mempererat kebersamaan antarwarga dan antarlembaga desa.</p>
<h2>Pelaksanaan Kegiatan</h2>
<p>Peserta berjalan bersama menempuh rute yang telah disiapkan panitia, dengan pengaturan lalu lintas dan penjagaan petugas di sepanjang jalur.</p>
<p>Dokumentasi kegiatan menjadi bahan publikasi kegiatan desa pada periode berikutnya.</p>`,
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
      throw new Error(`Artikel terbit "${article.slug}" wajib punya publishedAt.`);
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
    const unexpectedTags = [...usedTags].filter((tag) => !ALLOWED_TAGS.has(tag));
    if (unexpectedTags.length) {
      throw new Error(
        `Konten "${article.slug}" memakai tag di luar daftar: ${unexpectedTags.join(", ")}.`,
      );
    }
  }
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

async function insertArticles(client, author, categories) {
  let inserted = 0;
  let skipped = 0;
  let insertedPublished = 0;
  let insertedDraft = 0;

  for (const article of ARTICLES) {
    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;

    // cover_image_url sengaja NULL: berkas /uploads/<uuid> baru ada setelah
    // diunggah lewat panel, jadi tidak ada gambar yang bisa dirujuk di sini.
    const { rows } = await client.query(
      `INSERT INTO articles
         (title, slug, excerpt, content_html, cover_image_url, category_id,
          author_id, status, published_at)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [
        article.title,
        article.slug,
        article.excerpt,
        cleanContent(article.contentHtml),
        categories.idsBySlug.get(article.categorySlug),
        author.id,
        article.status,
        publishedAt,
      ],
    );

    if (!rows[0]) {
      skipped += 1;
      continue;
    }

    inserted += 1;
    if (article.status === "published") insertedPublished += 1;
    else insertedDraft += 1;
  }

  return { inserted, skipped, insertedPublished, insertedDraft };
}

async function run() {
  assertAllowedToRun();
  assertArticlesAreValid();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const author = await resolveAuthor(client);
    const categories = await ensureCategories(client);
    const articles = await insertArticles(client, author, categories);

    await client.query("COMMIT");

    console.log(`Penulis artikel contoh: user id ${author.id} (${author.role}), sumber ${author.source}.`);
    console.log(
      `Kategori: ${categories.inserted} dibuat, ${categories.skipped} dilewati (sudah ada).`,
    );
    console.log(
      `Artikel : ${articles.inserted} dibuat (${articles.insertedPublished} terbit, ${articles.insertedDraft} draf), ` +
        `${articles.skipped} dilewati (slug sudah ada).`,
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
