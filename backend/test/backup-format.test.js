// Uji format data.json backup tanpa database. Validasi dipakai bersama oleh
// endpoint restore, jadi berkas ini menjaga kompatibilitas v1 dan aturan v2.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { backupDataSchema } from "../routes/backup.js";

const v1Backup = {
  formatVersion: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  categories: [],
  articles: [],
  siteContent: {},
};

const v2Backup = {
  ...v1Backup,
  formatVersion: 2,
  gallery: [
    {
      imageUrl: "/uploads/abcdef12-3456-7890-abcd-ef1234567890.jpg",
      caption: "Rapat anggota",
      eventDate: "2026-01-31",
      sortOrder: 0,
    },
  ],
  team: [
    {
      name: "Siti",
      position: "Ketua",
      termLabel: "2024-2029",
      photoUrl: null,
      sortOrder: 0,
    },
  ],
  documents: [
    {
      title: "Laporan Tahunan 2025",
      year: 2025,
      description: "Laporan pertanggungjawaban.",
      url: "https://contoh.id/laporan-2025.pdf",
    },
  ],
  serviceDetails: [
    {
      slug: "simpan-pinjam",
      title: "Simpan Pinjam",
      summary: "Layanan simpanan dan pinjaman.",
      requirements: ["KTP", "Kartu keluarga"],
      steps: ["Datang ke kantor", "Isi formulir"],
      sortOrder: 0,
    },
  ],
  faqs: [
    {
      question: "Apa itu BUMDESMA?",
      answer: "Badan usaha milik desa bersama.",
      sortOrder: 0,
    },
  ],
};

describe("format backup", () => {
  it("backup v1 lama tetap tervalidasi", () => {
    const parsed = backupDataSchema.safeParse(v1Backup);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.formatVersion, 1);
    assert.equal(parsed.data.gallery, undefined);
  });

  it("backup v2 dengan lima daftar baru tervalidasi", () => {
    const parsed = backupDataSchema.safeParse(v2Backup);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    assert.equal(parsed.data.gallery.length, 1);
    assert.equal(parsed.data.team.length, 1);
    assert.equal(parsed.data.documents.length, 1);
    assert.equal(parsed.data.serviceDetails.length, 1);
    assert.equal(parsed.data.faqs.length, 1);
  });

  it("kunci tak dikenal tetap diabaikan", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      kunciBaru: { apa: "saja" },
    });
    assert.equal(parsed.success, true);
    assert.equal("kunciBaru" in parsed.data, false);
  });

  it("tautan dokumen http (bukan https) ditolak", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      documents: [
        {
          ...v2Backup.documents[0],
          url: "http://contoh.id/laporan-2025.pdf",
        },
      ],
    });
    assert.equal(parsed.success, false);
  });

  it("gambar galeri di luar /uploads ditolak", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      gallery: [
        {
          ...v2Backup.gallery[0],
          imageUrl: "https://evil.example/gambar.jpg",
        },
      ],
    });
    assert.equal(parsed.success, false);
  });

  it("teks pengurus yang memuat < atau > ditolak", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      team: [
        {
          ...v2Backup.team[0],
          name: "<script>alert(1)</script>",
        },
      ],
    });
    assert.equal(parsed.success, false);
  });

  it("versi format selain 1 dan 2 ditolak", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      formatVersion: 3,
    });
    assert.equal(parsed.success, false);
  });

  it("daftar lebih dari 5.000 baris ditolak", () => {
    const parsed = backupDataSchema.safeParse({
      ...v2Backup,
      faqs: Array.from({ length: 5001 }, () => v2Backup.faqs[0]),
    });
    assert.equal(parsed.success, false);
  });
});
