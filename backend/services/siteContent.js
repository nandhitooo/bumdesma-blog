import { z } from "zod";
import { pool } from "../db/pool.js";

export const SITE_CONTENT_KEYS = [
  "hero",
  "about",
  "services",
  "contact",
  "footer",
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

export const siteContentSchemas = {
  hero: z
    .object({
      title: plainText(200),
      subtitle: plainText(200),
      description: plainText(1000),
      buttonLabel: plainText(100),
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
  },
};

const siteContentKeySchema = z.enum(SITE_CONTENT_KEYS);

async function readContentState() {
  const { rows } = await pool.query(
    "SELECT key, content, updated_at FROM site_content",
  );
  const content = Object.fromEntries(
    SITE_CONTENT_KEYS.map((key) => [key, { ...DEFAULTS[key] }]),
  );
  const updatedAt = Object.fromEntries(
    SITE_CONTENT_KEYS.map((key) => [key, null]),
  );

  for (const row of rows) {
    content[row.key] = { ...DEFAULTS[row.key], ...row.content };
    updatedAt[row.key] = row.updated_at;
  }

  return { content, updatedAt };
}

export async function getAll() {
  const { content } = await readContentState();
  return content;
}

export async function getAllWithUpdatedAt() {
  return readContentState();
}

export async function resetKey(key) {
  const parsedKey = siteContentKeySchema.parse(key);
  await pool.query("DELETE FROM site_content WHERE key = $1", [parsedKey]);
}

