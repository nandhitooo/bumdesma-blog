import { z } from "zod";
import { pool } from "../db/pool.js";

export const SITE_CONTENT_KEYS = [
  "hero",
  "about",
  "services",
  "contact",
  "footer",
  "site",
  "sections",
];

const plainText = (max) =>
  z
    .string()
    .trim()
    .min(1, "Teks wajib diisi.")
    .max(max)
    .refine((value) => !/[<>]/.test(value), "Konten harus berupa teks biasa.");

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .url("URL tidak valid.")
  .refine(
    (value) => /^https:\/\//i.test(value),
    "URL harus menggunakan HTTPS.",
  );

const optionalUrl = z.union([z.literal(""), httpsUrl]);

// Gambar hanya boleh berasal dari unggahan panel admin (atau URL HTTPS yang
// memang dikelola admin). String kosong berarti pakai aset bawaan frontend.
const uploadedImage = z
  .string()
  .trim()
  .max(500)
  .regex(
    /^\/uploads\/[0-9a-fA-F-]+\.(?:jpg|png|webp)$/i,
    "Gambar harus diunggah lewat panel admin.",
  );

const optionalImage = z.union([z.literal(""), uploadedImage, httpsUrl]);

// Tautan internal dibatasi ke path di dalam situs ini supaya isi footer tidak
// bisa dipakai untuk mengalihkan pengunjung ke domain lain.
const internalPath = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => /^\/(?:[a-z0-9][a-z0-9/-]*)?(?:#[a-z0-9-]+)?$/i.test(value),
    "Tautan internal tidak valid.",
  );

const footerLinkSchema = z
  .object({
    label: plainText(80),
    href: z.union([internalPath, httpsUrl]),
  })
  .strict();

const iconSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{1,40}$/, "Nama ikon tidak valid.");

const highlightSchema = z
  .object({
    icon: iconSchema,
    title: plainText(120),
    desc: plainText(500),
  })
  .strict();

const serviceSchema = highlightSchema;

const pageHeadingSchema = z
  .object({
    eyebrow: plainText(120),
    title: plainText(200),
    description: plainText(600),
    emptyTitle: plainText(200),
    emptyText: plainText(600),
  })
  .strict();

export const siteContentSchemas = {
  hero: z
    .object({
      title: plainText(200),
      subtitle: plainText(200),
      description: plainText(1000),
      buttonLabel: plainText(100),
      // Opsional supaya data dan backup lama tanpa gambar hero tetap valid.
      imageUrl: optionalImage.optional(),
      highlights: z.array(highlightSchema).min(1).max(6),
    })
    .strict(),
  about: z
    .object({
      heading: plainText(200),
      location: plainText(300),
      paragraphs: z.array(plainText(2000)).min(1).max(6),
      profileUrl: httpsUrl,
      // Opsional supaya data lama dan backup lama tetap valid; string kosong
      // berarti admin sengaja mengosongkan visi.
      vision: z.union([z.literal(""), plainText(500)]).optional(),
      missions: z.array(plainText(300)).max(8).optional(),
    })
    .strict(),
  services: z
    .object({
      items: z.array(serviceSchema).min(1).max(12),
    })
    .strict(),
  contact: z
    .object({
      address: plainText(500),
      email: z.string().trim().email("Alamat email tidak valid.").max(254),
      whatsapp: z
        .string()
        .trim()
        .regex(/^\d{8,15}$/, "Nomor WhatsApp harus berisi 8–15 digit."),
      whatsappDisplay: plainText(40),
      mapsLink: httpsUrl,
      mapsEmbedUrl: httpsUrl.refine(
        (value) => value.startsWith("https://www.google.com/maps/embed"),
        "URL peta harus menggunakan Google Maps Embed.",
      ),
    })
    .strict(),
  footer: z
    .object({
      description: plainText(1000),
      address: plainText(500),
      phone: plainText(40),
      email: z.string().trim().email("Alamat email tidak valid.").max(254),
      social: z
        .object({
          facebook: optionalUrl,
          instagram: optionalUrl,
          youtube: optionalUrl,
        })
        .strict(),
      // Semua tambahan di bawah opsional supaya baris lama dan backup lama
      // tetap valid; nilainya diambil dari DEFAULTS saat kosong.
      brandTagline: plainText(160).optional(),
      legalNote: plainText(200).optional(),
      navHeading: plainText(120).optional(),
      navLinks: z.array(footerLinkSchema).min(1).max(10).optional(),
      servicesHeading: plainText(120).optional(),
      serviceLinks: z.array(footerLinkSchema).min(1).max(10).optional(),
      contactHeading: plainText(120).optional(),
    })
    .strict(),
  site: z
    .object({
      name: plainText(120),
      legalName: plainText(160),
      tagline: plainText(160),
      logoUrl: optionalImage,
      partnerLogoUrl: optionalImage,
      metaTitle: plainText(200),
      metaDescription: plainText(400),
      feedTitle: plainText(200),
      feedDescription: plainText(400),
      copyright: plainText(200),
      locationLine: plainText(160),
      adminPortalLabel: plainText(60),
      nav: z
        .object({
          home: plainText(40),
          about: plainText(40),
          services: plainText(40),
          activity: plainText(40),
          contact: plainText(40),
          blog: plainText(40),
          gallery: plainText(40),
          transparency: plainText(40),
          team: plainText(40),
          more: plainText(40),
        })
        .strict(),
    })
    .strict(),
  sections: z
    .object({
      home: z
        .object({
          newsEyebrow: plainText(120),
          newsTitle: plainText(200),
          newsDescription: plainText(600),
          newsCta: plainText(100),
          readMore: plainText(100),
          readMoreShort: plainText(100),
        })
        .strict(),
      about: z
        .object({
          eyebrow: plainText(120),
          visionEyebrow: plainText(120),
          visionTitle: plainText(200),
          visionLabel: plainText(60),
          missionLabel: plainText(60),
          profileCta: plainText(120),
        })
        .strict(),
      services: z
        .object({
          eyebrow: plainText(120),
          title: plainText(200),
          description: plainText(600),
          cta: plainText(120),
        })
        .strict(),
      activity: z
        .object({
          eyebrow: plainText(120),
          title: plainText(200),
          description: plainText(600),
          cta: plainText(120),
          detailLabel: plainText(100),
          galleryCategory: plainText(60),
        })
        .strict(),
      contact: z
        .object({
          eyebrow: plainText(120),
          title: plainText(200),
          description: plainText(600),
          addressTitle: plainText(120),
          addressCta: plainText(120),
          emailTitle: plainText(120),
          emailCta: plainText(120),
          whatsappTitle: plainText(120),
          whatsappCta: plainText(120),
        })
        .strict(),
      // Halaman daftar memakai susunan judul yang sama: eyebrow, judul,
      // deskripsi, lalu teks saat daftarnya kosong.
      blog: pageHeadingSchema,
      faq: pageHeadingSchema,
      gallery: pageHeadingSchema,
      team: pageHeadingSchema,
      transparency: pageHeadingSchema,
      serviceList: pageHeadingSchema,
    })
    .strict(),
};

export const DEFAULTS = {
  hero: {
    subtitle: "BUMDESMA Podo Rukun LKD • Wilangan, Nganjuk",
    title: "Penggerak Ekonomi & Kemandirian Desa Wilangan",
    description:
      "BUMDESMA Podo Rukun LKD berperan sebagai penggerak ekonomi desa melalui pengelolaan usaha bersama secara profesional, transparan, dan inovatif demi kesejahteraan masyarakat.",
    buttonLabel: "Lihat Berita Terbaru",
    imageUrl: "",
    highlights: [
      {
        icon: "calendar-check",
        title: "Riwayat Program",
        desc:
          "Program Pengembangan Kecamatan (PPK) yang berjalan bertahap sejak tahun 2003 hingga 2014.",
      },
      {
        icon: "scale-balanced",
        title: "Badan Hukum",
        desc:
          "Sertifikat Pendaftaran Pendirian Badan Hukum Nomor AHU-00115.AH.01.35.Tahun 2022.",
      },
      {
        icon: "location-dot",
        title: "Alamat Kantor",
        desc:
          "Kantor beralamat di Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Provinsi Jawa Timur.",
      },
    ],
  },
  about: {
    heading: "Membangun Kemandirian Ekonomi Desa",
    location: "Kecamatan Wilangan • Kabupaten Nganjuk • Jawa Timur",
    paragraphs: [
      "BUMDesma PODO RUKUN LKD bermula dari Program Pengembangan Kecamatan (PPK) yang berjalan bertahap sejak tahun 2003 hingga 2014, meliputi PPK Fase II Siklus 4 sampai Siklus 6, PPK Fase III, PPK PNPM, PNPM Generasi Sehat dan Cerdas, PNPM DSC, PNPM Open Menu, PNPM MP Optimalisasi, PNPM MP, serta PNPM MPD dengan total dana yang diterima Kecamatan Wilangan mencapai Rp 11.353.000.000.",
      "BUMDesa Bersama PODO RUKUN LKD telah memperoleh persetujuan dan pengesahan resmi dari Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia melalui Sertifikat Pendaftaran Pendirian Badan Hukum Nomor AHU-00115.AH.01.35.Tahun 2022.",
      "Kantor beralamat di Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Provinsi Jawa Timur.",
    ],
    profileUrl:
      "https://drive.google.com/file/d/1EvypZ1A4ly4bN0URJ0BAASBzNXsf2AWJ/view?usp=sharing",
    vision:
      "Menjadi penggerak ekonomi dan kemandirian desa di Kecamatan Wilangan melalui pengelolaan usaha bersama yang profesional, transparan, dan inovatif.",
    missions: [
      "Menyediakan layanan permodalan dan keuangan yang mudah dijangkau kelompok masyarakat desa.",
      "Mengelola unit usaha secara profesional dan inovatif demi kesejahteraan masyarakat.",
      "Menjaga keterbukaan melalui laporan dan dokumen yang dapat diakses publik.",
      "Mendampingi kelompok dan pelaku usaha desa melalui pembinaan berkala.",
    ],
  },
  services: {
    items: [
      {
        icon: "coins",
        title: "Dana Bergulir Masyarakat",
        desc:
          "Penyediaan modal usaha berkelanjutan bagi kelompok masyarakat desa guna meningkatkan kemandirian ekonomi dan kesejahteraan keluarga.",
      },
      {
        icon: "credit-card",
        title: "Pembelian Kredit",
        desc:
          "Layanan pembelian barang secara kredit dengan syarat mudah dan cicilan terjangkau untuk kebutuhan usaha maupun rumah tangga.",
      },
      {
        icon: "building-columns",
        title: "Keagenan Bank",
        desc:
          "Layanan tarik tunai, transfer, dan pembayaran tagihan tanpa perlu ke bank.",
      },
      {
        icon: "bus-simple",
        title: "Penyewaan Elf",
        desc:
          "Sewa armada Elf dengan driver berpengalaman untuk perjalanan dalam dan luar kota.",
      },
      {
        icon: "landmark",
        title: "PT. LKM",
        desc:
          "Layanan keuangan mikro desa untuk mendukung pertumbuhan ekonomi melalui pembiayaan dan pendampingan usaha.",
      },
    ],
  },
  contact: {
    address:
      "Jln. Makam Syekh Sulukhi, Wilangan, Kec. Wilangan, Kabupaten Nganjuk, Jawa Timur 64462",
    email: "bumdesmapodorukun@gmail.com",
    whatsapp: "6285156162917",
    whatsappDisplay: "+62 851-5616-2917",
    mapsLink: "https://maps.app.goo.gl/DRFWDQnaQ5on7btF8",
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1977.577637645205!2d111.8042181!3d-7.5580429!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79cb7bd2add4c1%3A0x7ee799cc5f783f1b!2sBumdesma%20Podo%20Rukun!5e0!3m2!1sid!2sid!4v1770733882545",
  },
  footer: {
    description:
      "BUMDESMA Podo Rukun LKD berkomitmen memajukan perekonomian desa melalui pengelolaan usaha yang profesional, transparan, dan inovatif demi kesejahteraan masyarakat Kecamatan Wilangan.",
    address:
      "Jln. Makam Syekh Sulukhi, Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kec. Wilangan, Kab. Nganjuk, Jawa Timur 64462",
    phone: "+62 851-5616-2917",
    email: "bumdesmapodorukun@gmail.com",
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
    },
    brandTagline: "LKD Kec. Wilangan",
    legalNote: "Badan Hukum AHU-00115.AH.01.35.Tahun 2022",
    navHeading: "Tautan Navigasi",
    navLinks: [
      { label: "Beranda", href: "/#home" },
      { label: "Tentang Kami", href: "/#about" },
      { label: "Blog & Berita", href: "/blog" },
      { label: "Galeri Dokumentasi", href: "/galeri" },
      { label: "Transparansi Laporan", href: "/transparansi" },
      { label: "Susunan Pengurus", href: "/pengurus" },
      { label: "Tanya Jawab (FAQ)", href: "/faq" },
    ],
    servicesHeading: "Unit Layanan Usaha",
    serviceLinks: [
      { label: "Dana Bergulir Masyarakat (SPP)", href: "/layanan" },
      { label: "Perdagangan & Jasa Desa", href: "/layanan" },
      { label: "Penguatan Usaha Warga", href: "/layanan" },
      { label: "Syarat & Alur Pengajuan", href: "/layanan" },
    ],
    contactHeading: "Kontak Kantor",
  },
  site: {
    name: "BUMDESMA Podo Rukun",
    legalName: "BUMDESMA Podo Rukun LKD",
    tagline: "Kec. Wilangan, Kab. Nganjuk",
    logoUrl: "",
    partnerLogoUrl: "",
    metaTitle: "BUMDESMA PODO RUKUN LKD",
    metaDescription:
      "Situs resmi BUMDESMA Podo Rukun LKD Kecamatan Wilangan, Kabupaten Nganjuk: profil lembaga, layanan unit usaha, kegiatan, dan berita terbaru.",
    feedTitle: "BUMDESMA Podo Rukun",
    feedDescription:
      "Kegiatan, layanan, dan berita BUMDESMA Podo Rukun LKD.",
    copyright: "BUMDESMA Podo Rukun LKD. Hak Cipta Dilindungi.",
    locationLine: "Kecamatan Wilangan, Kabupaten Nganjuk",
    adminPortalLabel: "Portal Pengelola",
    nav: {
      home: "Beranda",
      about: "Tentang",
      services: "Layanan",
      activity: "Kegiatan",
      contact: "Kontak",
      blog: "Blog",
      gallery: "Galeri",
      transparency: "Transparansi",
      team: "Pengurus",
      more: "Lainnya",
    },
  },
  sections: {
    home: {
      newsEyebrow: "Publikasi & Kabar",
      newsTitle: "Berita Terbaru",
      newsDescription:
        "Kabar, pengumuman, dan cerita terkini seputar kegiatan BUMDESMA.",
      newsCta: "Lihat Semua Blog",
      readMore: "Baca artikel lengkap",
      readMoreShort: "Baca selengkapnya",
    },
    about: {
      eyebrow: "Tentang BUMDESMA",
      visionEyebrow: "Arah Lembaga",
      visionTitle: "Visi & Misi",
      visionLabel: "Visi",
      missionLabel: "Misi",
      profileCta: "Unduh Dokumen Profil Resmi",
    },
    services: {
      eyebrow: "Unit Usaha",
      title: "Layanan Kami",
      description:
        "Berbagai layanan profesional untuk mendukung pertumbuhan ekonomi dan kemandirian masyarakat desa.",
      cta: "Lihat syarat dan alur pengajuan",
    },
    activity: {
      eyebrow: "Dokumentasi",
      title: "Kegiatan Terbaru",
      description:
        "Dokumentasi berbagai program dan kegiatan operasional BUMDESMA dalam memajukan ekonomi desa.",
      cta: "Buka Galeri Penuh",
      detailLabel: "Lihat detail",
      galleryCategory: "Dokumentasi",
    },
    contact: {
      eyebrow: "Kontak & Lokasi",
      title: "Hubungi Kami",
      description:
        "Kami siap melayani kebutuhan informasi dan konsultasi masyarakat terkait seluruh layanan dan program BUMDESMA.",
      addressTitle: "Alamat Kantor",
      addressCta: "Buka di Google Maps",
      emailTitle: "Surat Elektronik",
      emailCta: "Kirim Email",
      whatsappTitle: "WhatsApp Layanan",
      whatsappCta: "Kirim Pesan WhatsApp",
    },
    blog: {
      eyebrow: "Kabar & Publikasi",
      title: "Blog BUMDESMA Podo Rukun",
      description:
        "Informasi, kegiatan, dan cerita terbaru dari BUMDESMA Podo Rukun LKD Kecamatan Wilangan.",
      emptyTitle: "Belum ada artikel",
      emptyText:
        "Artikel yang sesuai dengan kriteria pencarian atau kategori belum tersedia.",
    },
    faq: {
      eyebrow: "Bantuan & Informasi",
      title: "Pertanyaan yang Sering Diajukan",
      description:
        "Jawaban singkat atas pertanyaan umum seputar layanan BUMDESMA Podo Rukun LKD.",
      emptyTitle: "Belum ada FAQ",
      emptyText:
        "Pertanyaan umum akan tampil di sini setelah ditambahkan melalui panel admin.",
    },
    gallery: {
      eyebrow: "Dokumentasi",
      title: "Galeri BUMDESMA Podo Rukun",
      description:
        "Foto kegiatan, pembinaan, dan kebersamaan BUMDESMA Podo Rukun LKD Kecamatan Wilangan.",
      emptyTitle: "Belum ada foto",
      emptyText:
        "Foto kegiatan akan tampil di sini setelah ditambahkan melalui panel admin.",
    },
    team: {
      eyebrow: "Struktur Organisasi",
      title: "Pengurus BUMDESMA Podo Rukun",
      description:
        "Susunan pengurus BUMDESMA Podo Rukun LKD Kecamatan Wilangan beserta jabatan dan masa bakti.",
      emptyTitle: "Belum ada data pengurus",
      emptyText:
        "Susunan pengurus akan tampil di sini setelah ditambahkan melalui panel admin.",
    },
    transparency: {
      eyebrow: "Keterbukaan Informasi",
      title: "Transparansi Dokumen Laporan",
      description:
        "Laporan pertanggungjawaban dan dokumen resmi BUMDESMA Podo Rukun LKD per tahun, disajikan dalam bentuk tautan dokumen resmi.",
      emptyTitle: "Belum ada dokumen",
      emptyText:
        "Dokumen laporan akan tampil di sini setelah ditambahkan melalui panel admin.",
    },
    serviceList: {
      eyebrow: "Unit Usaha",
      title: "Layanan BUMDESMA Podo Rukun",
      description:
        "Ringkasan tiap unit usaha beserta syarat dan alur pengajuan yang perlu disiapkan masyarakat.",
      emptyTitle: "Belum ada layanan",
      emptyText:
        "Detail layanan akan tampil di sini setelah ditambahkan melalui panel admin.",
    },
  },
};

const siteContentKeySchema = z.enum(SITE_CONTENT_KEYS);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// Nilai tersimpan bisa saja hanya memuat sebagian field (mis. baris lama yang
// dibuat sebelum field baru ada). Gabungan dilakukan bertingkat supaya grup
// seperti `footer.social` atau `site.nav` tidak hilang seluruhnya.
export function mergeContentWithDefaults(defaults, content) {
  if (Array.isArray(defaults)) {
    return Array.isArray(content) ? content : [...defaults];
  }
  if (!isPlainObject(defaults)) {
    return content === undefined ? defaults : content;
  }

  const merged = { ...defaults };
  if (isPlainObject(content)) {
    for (const [key, value] of Object.entries(content)) {
      merged[key] = mergeContentWithDefaults(defaults[key], value);
    }
  }
  return merged;
}

// Dipisahkan dari query supaya perilaku bawaan (tabel kosong) bisa diuji tanpa
// database: setiap key yang belum tersimpan memakai DEFAULTS apa adanya.
export function buildSiteContent(rows = []) {
  const content = Object.fromEntries(
    SITE_CONTENT_KEYS.map((key) => [
      key,
      mergeContentWithDefaults(DEFAULTS[key], undefined),
    ]),
  );
  const updatedAt = Object.fromEntries(
    SITE_CONTENT_KEYS.map((key) => [key, null]),
  );

  for (const row of rows) {
    if (!SITE_CONTENT_KEYS.includes(row.key)) continue;
    content[row.key] = mergeContentWithDefaults(DEFAULTS[row.key], row.content);
    updatedAt[row.key] = row.updated_at ?? null;
  }

  return { content, updatedAt };
}

async function readContentState() {
  const { rows } = await pool.query(
    "SELECT key, content, updated_at FROM site_content",
  );
  return buildSiteContent(rows);
}

export async function getAll() {
  const { content } = await readContentState();
  return content;
}

export async function getAllWithUpdatedAt() {
  return readContentState();
}

// Dipakai berkas SEO (feed.xml) supaya judul dan deskripsi saluran ikut isi
// panel admin, dengan bawaan yang sama saat tabel masih kosong.
export async function getSiteIdentity() {
  const { rows } = await pool.query(
    "SELECT content FROM site_content WHERE key = 'site'",
  );
  return mergeContentWithDefaults(DEFAULTS.site, rows[0]?.content);
}

export async function resetKey(key) {
  const parsedKey = siteContentKeySchema.parse(key);
  await pool.query("DELETE FROM site_content WHERE key = $1", [parsedKey]);
}

