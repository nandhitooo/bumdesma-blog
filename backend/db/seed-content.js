// Data contoh FAQ dan detail layanan (syarat + alur pengajuan) per unit usaha.
//
//   npm run seed:content                      -> isi faqs + service_details
//   node backend/db/seed-content.js --force   -> tetap jalan walau NODE_ENV=production
//   Catatan: lewat npm gunakan `npm run seed:content -- -- --force`, karena npm
//   memakai --force untuk dirinya sendiri.
//
// Aman dijalankan berulang kali (idempotent):
//   - service_details memakai ON CONFLICT (slug) DO NOTHING, jadi layanan yang
//     sudah diedit admin lewat panel tidak ditimpa.
//   - faqs tidak punya kolom unik, jadi pertanyaan yang sama (setelah trim dan
//     huruf kecil) dilewati lewat WHERE NOT EXISTS.
//
// Isi sengaja hanya berupa gambaran umum. Tidak ada nominal pinjaman, suku
// bunga, tarif sewa, atau biaya yang dikarang: besaran pasti harus diisi admin
// dari ketentuan resmi BUMDESMA. Judul layanan mengikuti lima unit usaha di
// frontend/src/lib/defaultContent.js.
import { pool } from "./pool.js";
import {
  DEFAULTS,
  SITE_CONTENT_KEYS,
  siteContentSchemas,
} from "../services/siteContent.js";

const FORCE = process.argv.includes("--force");

// Batas ini sama dengan skema zod di routes/serviceDetails.js dan routes/faqs.js,
// supaya data seed tidak lolos di sini tetapi gagal saat diedit dari panel admin.
const LIMITS = {
  slug: 120,
  title: 150,
  summary: 600,
  listItem: 300,
  listLength: 20,
  question: 300,
  answer: 2000,
};
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SERVICES = [
  {
    slug: "dana-bergulir-masyarakat",
    title: "Dana Bergulir Masyarakat",
    summary:
      "Penyediaan modal usaha bagi kelompok masyarakat desa di Kecamatan Wilangan, dikelola secara bergulir agar manfaatnya terus berlanjut bagi anggota lain.",
    requirements: [
      "Warga Kecamatan Wilangan yang tergabung dalam kelompok peminjam (misalnya kelompok SPP atau UEP)",
      "Fotokopi KTP dan Kartu Keluarga pemohon",
      "Memiliki usaha atau rencana usaha produktif",
      "Bersedia mengikuti pertemuan dan pembinaan kelompok secara berkala",
      "Bersedia mengangsur sesuai jadwal yang disepakati bersama kelompok dan pengelola",
    ],
    steps: [
      "Hubungi kantor BUMDESMA atau ketua kelompok untuk menanyakan ketentuan terbaru",
      "Lengkapi berkas persyaratan dan isi formulir pengajuan",
      "Pengelola memeriksa kelengkapan berkas dan kelayakan usaha",
      "Kelompok dan pengelola bermusyawarah untuk menyepakati pengajuan",
      "Setelah disetujui, dana dicairkan dan jadwal angsuran disepakati",
      "Angsuran dibayarkan sesuai jadwal dan dicatat oleh pengelola",
    ],
    sortOrder: 1,
  },
  {
    slug: "pembelian-kredit",
    title: "Pembelian Kredit",
    summary:
      "Layanan pembelian barang secara kredit untuk kebutuhan usaha maupun rumah tangga, dengan pembayaran yang dicicil.",
    requirements: [
      "Fotokopi KTP pemohon",
      "Fotokopi Kartu Keluarga",
      "Alamat tinggal dan nomor telepon atau WhatsApp yang bisa dihubungi",
      "Bersedia membayar cicilan sesuai jadwal yang disepakati",
      "Mengisi dan menandatangani formulir pengajuan kredit",
    ],
    steps: [
      "Datang ke kantor BUMDESMA atau hubungi pengelola lewat WhatsApp untuk menanyakan barang yang tersedia",
      "Sampaikan barang yang ingin dibeli dan lama cicilan yang diinginkan",
      "Serahkan berkas persyaratan dan isi formulir pengajuan",
      "Pengelola memeriksa berkas dan menyampaikan hasilnya",
      "Setelah disetujui, tanda tangani kesepakatan kredit dan terima barang",
      "Bayar cicilan sesuai jadwal dan simpan bukti pembayaran",
    ],
    sortOrder: 2,
  },
  {
    slug: "keagenan-bank",
    title: "Keagenan Bank",
    summary:
      "Layanan perbankan sederhana di tingkat desa seperti tarik tunai, transfer, dan pembayaran tagihan, sehingga warga tidak perlu pergi ke kantor bank.",
    requirements: [
      "Membawa KTP atau identitas diri yang masih berlaku",
      "Membawa kartu ATM atau buku rekening bila melakukan tarik tunai atau transfer",
      "Menyiapkan nomor rekening tujuan atau nomor tagihan yang akan dibayar",
      "Menyiapkan uang tunai bila melakukan setoran atau pembayaran tagihan",
    ],
    steps: [
      "Datang ke kantor BUMDESMA pada jam layanan",
      "Sampaikan jenis transaksi yang diinginkan kepada petugas",
      "Serahkan kartu atau data yang diperlukan, lalu periksa kembali nominal dan nomor tujuan",
      "Petugas memproses transaksi",
      "Terima struk atau bukti transaksi dan periksa kebenarannya sebelum meninggalkan loket",
    ],
    sortOrder: 3,
  },
  {
    slug: "penyewaan-elf",
    title: "Penyewaan Elf",
    summary:
      "Sewa armada Elf lengkap dengan pengemudi berpengalaman untuk perjalanan dalam kota maupun luar kota, misalnya kegiatan keluarga, kelompok, atau lembaga.",
    requirements: [
      "Menyampaikan tanggal, tujuan, dan rute perjalanan",
      "Menyampaikan perkiraan jumlah penumpang",
      "Identitas penyewa (KTP) dan nomor telepon atau WhatsApp yang bisa dihubungi",
      "Menyetujui ketentuan sewa dan pembayaran yang berlaku",
    ],
    steps: [
      "Hubungi pengelola lewat WhatsApp atau datang ke kantor untuk menanyakan ketersediaan armada",
      "Sampaikan tanggal, tujuan, rute, dan jumlah penumpang",
      "Pengelola menyampaikan rincian biaya dan ketentuan sewa",
      "Sepakati jadwal dan lakukan pembayaran sesuai ketentuan yang berlaku",
      "Armada dan pengemudi disiapkan sesuai jadwal keberangkatan",
      "Setelah perjalanan selesai, lakukan penyelesaian pembayaran bila masih ada",
    ],
    sortOrder: 4,
  },
  {
    slug: "pt-lkm",
    title: "PT. LKM",
    summary:
      "Layanan keuangan mikro desa untuk mendukung pertumbuhan ekonomi warga melalui pembiayaan dan pendampingan usaha.",
    requirements: [
      "Fotokopi KTP dan Kartu Keluarga pemohon",
      "Memiliki usaha atau rencana usaha yang jelas",
      "Mengisi formulir pengajuan pembiayaan",
      "Bersedia mengikuti pendampingan usaha dari pengelola",
      "Berkas tambahan lain bila diminta oleh pengelola sesuai jenis pembiayaan",
    ],
    steps: [
      "Datang ke kantor atau hubungi pengelola untuk konsultasi jenis pembiayaan",
      "Serahkan berkas persyaratan dan isi formulir pengajuan",
      "Pengelola memeriksa berkas dan menilai kelayakan usaha",
      "Pemohon menerima hasil pengajuan dan penjelasan ketentuan pembiayaan",
      "Setelah disetujui, tanda tangani perjanjian dan terima pembiayaan",
      "Bayar angsuran sesuai jadwal dan ikuti pendampingan usaha",
    ],
    sortOrder: 5,
  },
];

const FAQS = [
  {
    question: "Apa itu BUMDESMA Podo Rukun LKD?",
    answer:
      "BUMDESMA (BUMDesa Bersama) Podo Rukun LKD adalah badan usaha milik beberapa desa di Kecamatan Wilangan, Kabupaten Nganjuk, yang mengelola usaha bersama untuk menggerakkan ekonomi dan kemandirian desa. Lembaga ini telah memperoleh pengesahan badan hukum dari Kementerian Hukum dan HAM melalui Sertifikat Pendaftaran Pendirian Badan Hukum Nomor AHU-00115.AH.01.35.Tahun 2022.",
    sortOrder: 1,
  },
  {
    question: "Layanan apa saja yang tersedia?",
    answer:
      "Saat ini tersedia lima unit usaha: Dana Bergulir Masyarakat, Pembelian Kredit, Keagenan Bank, Penyewaan Elf, dan PT. LKM. Syarat dan alur pengajuan tiap unit dapat dilihat di halaman Layanan.",
    sortOrder: 2,
  },
  {
    question: "Siapa yang boleh memakai layanan BUMDESMA?",
    answer:
      "Layanan terutama ditujukan bagi warga Kecamatan Wilangan dan sekitarnya. Ketentuan peserta dapat berbeda di tiap unit usaha, misalnya Dana Bergulir Masyarakat yang disalurkan lewat kelompok. Untuk kepastian, hubungi kantor atau pengelola.",
    sortOrder: 3,
  },
  {
    question: "Bagaimana cara mengajukan pinjaman atau pembiayaan?",
    answer:
      "Langkah umumnya:\n1. Hubungi kantor atau pengelola untuk konsultasi.\n2. Lengkapi berkas dan formulir pengajuan.\n3. Tunggu pemeriksaan berkas oleh pengelola.\n4. Setelah disetujui, tanda tangani kesepakatan dan dana dicairkan.\nRincian tiap unit ada di halaman Layanan.",
    sortOrder: 4,
  },
  {
    question: "Dokumen apa yang biasanya perlu disiapkan?",
    answer:
      "Umumnya fotokopi KTP dan Kartu Keluarga. Beberapa layanan dapat meminta berkas tambahan, misalnya keterangan usaha atau keanggotaan kelompok. Daftar lengkapnya tercantum pada bagian Syarat di halaman tiap layanan.",
    sortOrder: 5,
  },
  {
    question: "Berapa besar bunga, biaya, atau tarif layanan?",
    answer:
      "Besaran bunga, biaya, dan tarif berbeda untuk tiap unit usaha dan dapat berubah sesuai ketentuan lembaga. Karena itu informasi pastinya disampaikan langsung oleh pengelola saat konsultasi, agar Anda mendapat angka yang berlaku saat ini.",
    sortOrder: 6,
  },
  {
    question: "Bagaimana jika saya terlambat membayar angsuran?",
    answer:
      "Segera hubungi pengelola atau ketua kelompok sebelum jatuh tempo agar bisa dicari penyelesaian bersama. Ketentuan keterlambatan mengikuti kesepakatan yang Anda tanda tangani saat pengajuan.",
    sortOrder: 7,
  },
  {
    question: "Bagaimana cara memesan Elf untuk perjalanan?",
    answer:
      "Hubungi pengelola lewat WhatsApp atau datang ke kantor, lalu sampaikan tanggal, tujuan, dan jumlah penumpang. Pengelola akan mengecek ketersediaan armada dan menyampaikan rincian biaya serta ketentuan sewa.",
    sortOrder: 8,
  },
  {
    question: "Di mana lokasi kantor dan bagaimana menghubungi pengelola?",
    answer:
      "Kantor berada di Jln. Makam Syekh Sulukhi, Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Jawa Timur 64462. Anda juga dapat menghubungi WhatsApp +62 851-5616-2917 atau email bumdesmapodorukun@gmail.com.",
    sortOrder: 9,
  },
  {
    question: "Di mana saya bisa melihat laporan dan kegiatan BUMDESMA?",
    answer:
      "Kegiatan terbaru dimuat di halaman Berita, dokumentasi di halaman Galeri, dan laporan resmi di halaman Transparansi.",
    sortOrder: 10,
  },
];

const hasMarkup = (value) => /[<>]/.test(value);

function assertLength(label, value, max) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} wajib diisi.`);
  }
  if (value.trim().length > max) {
    throw new Error(`${label} ${value.trim().length} karakter, melebihi batas ${max}.`);
  }
  if (hasMarkup(value)) {
    throw new Error(`${label} harus berupa teks biasa (tanpa < atau >).`);
  }
}

function assertList(label, list) {
  if (!Array.isArray(list) || list.length > LIMITS.listLength) {
    throw new Error(`${label} harus berupa array maksimal ${LIMITS.listLength} butir.`);
  }
  list.forEach((item, index) =>
    assertLength(`${label} butir ${index + 1}`, item, LIMITS.listItem),
  );
}

// Isi bawaan konten situs (hero, tentang, layanan, kontak, footer, identitas,
// dan judul section) ditulis sebagai baris nyata supaya panel admin bisa
// langsung mengubahnya. DEFAULTS adalah sumber yang sama dengan API publik,
// jadi tampilan situs tidak berubah setelah seed.
function assertSiteContentIsValid() {
  for (const key of SITE_CONTENT_KEYS) {
    const parsed = siteContentSchemas[key].safeParse(DEFAULTS[key]);
    if (!parsed.success) {
      throw new Error(
        `Konten bawaan "${key}" tidak valid: ${parsed.error.issues[0].message}`,
      );
    }
  }
}

// Pemeriksaan sederhana supaya data contoh tidak ditolak oleh validasi panel admin.
function assertDataIsValid() {
  const slugs = new Set();
  for (const service of SERVICES) {
    if (
      !SLUG_PATTERN.test(service.slug) ||
      service.slug.length > LIMITS.slug
    ) {
      throw new Error(`Slug layanan tidak valid: ${service.slug}`);
    }
    if (slugs.has(service.slug)) {
      throw new Error(`Slug layanan ganda: ${service.slug}`);
    }
    slugs.add(service.slug);
    assertLength(`Judul "${service.slug}"`, service.title, LIMITS.title);
    assertLength(`Ringkasan "${service.slug}"`, service.summary, LIMITS.summary);
    assertList(`Syarat "${service.slug}"`, service.requirements);
    assertList(`Alur "${service.slug}"`, service.steps);
    if (!Number.isInteger(service.sortOrder)) {
      throw new Error(`Urutan layanan "${service.slug}" harus bilangan bulat.`);
    }
  }

  const questions = new Set();
  for (const faq of FAQS) {
    assertLength(`Pertanyaan "${faq.question}"`, faq.question, LIMITS.question);
    assertLength(`Jawaban "${faq.question}"`, faq.answer, LIMITS.answer);
    const key = faq.question.trim().toLowerCase();
    if (questions.has(key)) {
      throw new Error(`Pertanyaan FAQ ganda: ${faq.question}`);
    }
    questions.add(key);
    if (!Number.isInteger(faq.sortOrder) || faq.sortOrder < 0 || faq.sortOrder > 9999) {
      throw new Error(`Urutan FAQ "${faq.question}" harus 0-9999.`);
    }
  }
}

function assertAllowedToRun() {
  if ((process.env.NODE_ENV || "development") === "production" && !FORCE) {
    throw new Error(
      "Seed FAQ dan layanan tidak dijalankan karena NODE_ENV=production. " +
        "Kalau memang disengaja, jalankan `node backend/db/seed-content.js --force` " +
        "(atau `npm run seed:content -- -- --force`), karena npm memakai flag --force untuk dirinya sendiri.",
    );
  }
}

async function insertServices(client) {
  let inserted = 0;
  let skipped = 0;

  for (const service of SERVICES) {
    const { rowCount } = await client.query(
      `INSERT INTO service_details (slug, title, summary, requirements, steps, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING`,
      [
        service.slug,
        service.title.trim(),
        service.summary.trim(),
        JSON.stringify(service.requirements.map((item) => item.trim())),
        JSON.stringify(service.steps.map((item) => item.trim())),
        service.sortOrder,
      ],
    );
    if (rowCount) inserted += 1;
    else skipped += 1;
  }

  return { inserted, skipped };
}

async function insertSiteContent(client) {
  let inserted = 0;
  let skipped = 0;

  for (const key of SITE_CONTENT_KEYS) {
    const { rowCount } = await client.query(
      `INSERT INTO site_content (key, content)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(DEFAULTS[key])],
    );
    if (rowCount) inserted += 1;
    else skipped += 1;
  }

  return { inserted, skipped };
}

async function insertFaqs(client) {
  let inserted = 0;
  let skipped = 0;

  for (const faq of FAQS) {
    const { rowCount } = await client.query(
      `INSERT INTO faqs (question, answer, sort_order)
       SELECT $1::text, $2::text, $3::integer
       WHERE NOT EXISTS (
         SELECT 1 FROM faqs WHERE lower(btrim(question)) = lower(btrim($1::text))
       )`,
      [faq.question.trim(), faq.answer.trim(), faq.sortOrder],
    );
    if (rowCount) inserted += 1;
    else skipped += 1;
  }

  return { inserted, skipped };
}

async function run() {
  assertAllowedToRun();
  assertSiteContentIsValid();
  assertDataIsValid();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const services = await insertServices(client);
    const faqs = await insertFaqs(client);
    const siteContent = await insertSiteContent(client);
    await client.query("COMMIT");

    console.log(
      `Layanan: ${services.inserted} dibuat, ${services.skipped} dilewati (slug sudah ada).`,
    );
    console.log(
      `FAQ    : ${faqs.inserted} dibuat, ${faqs.skipped} dilewati (pertanyaan sudah ada).`,
    );
    console.log(
      `Konten : ${siteContent.inserted} bagian dibuat, ${siteContent.skipped} dilewati (sudah ada).`,
    );

    if (
      services.inserted === 0 &&
      faqs.inserted === 0 &&
      siteContent.inserted === 0
    ) {
      console.log("Tidak ada data baru: data contoh sudah ada di database.");
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
