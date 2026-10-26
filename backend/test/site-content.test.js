// Uji konten situs tanpa database: skema tiap key, penggabungan dengan nilai
// bawaan, dan validasi backup untuk key baru (`site` dan `sections`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS,
  SITE_CONTENT_KEYS,
  buildSiteContent,
  mergeContentWithDefaults,
  siteContentSchemas,
} from "../services/siteContent.js";
import { backupDataSchema, validateSiteContent } from "../routes/backup.js";

const frontendDefaults = await import(
  new URL("../../frontend/src/lib/defaultContent.js", import.meta.url)
);

describe("skema konten situs", () => {
  it("setiap key bawaan lolos skema .strict() miliknya", () => {
    for (const key of SITE_CONTENT_KEYS) {
      const parsed = siteContentSchemas[key].safeParse(DEFAULTS[key]);
      assert.equal(
        parsed.success,
        true,
        `${key}: ${JSON.stringify(parsed.error?.issues)}`,
      );
    }
  });

  it("nilai bawaan backend sama dengan defaultContent frontend", () => {
    assert.deepEqual(frontendDefaults.DEFAULT_SITE_CONTENT, DEFAULTS);
  });

  it("key site menolak field tak dikenal", () => {
    const parsed = siteContentSchemas.site.safeParse({
      ...DEFAULTS.site,
      fieldAsing: "x",
    });
    assert.equal(parsed.success, false);
  });

  it("key site menolak teks berisi markup", () => {
    const parsed = siteContentSchemas.site.safeParse({
      ...DEFAULTS.site,
      name: "<b>Podo Rukun</b>",
    });
    assert.equal(parsed.success, false);
  });

  it("logo hanya boleh kosong, unggahan /uploads, atau HTTPS", () => {
    const withLogo = (logoUrl) =>
      siteContentSchemas.site.safeParse({ ...DEFAULTS.site, logoUrl }).success;

    assert.equal(withLogo(""), true);
    assert.equal(withLogo("/uploads/abc-123.png"), true);
    assert.equal(withLogo("https://contoh.id/logo.png"), true);
    assert.equal(withLogo("/podo-rukun.png"), false);
    assert.equal(withLogo("javascript:alert(1)"), false);
  });

  it("gambar hero opsional supaya data lama tetap valid", () => {
    const { imageUrl: _imageUrl, ...heroTanpaGambar } = DEFAULTS.hero;
    assert.equal(siteContentSchemas.hero.safeParse(heroTanpaGambar).success, true);
    assert.equal(
      siteContentSchemas.hero.safeParse({
        ...heroTanpaGambar,
        imageUrl: "/uploads/abc-123.jpg",
      }).success,
      true,
    );
  });

  it("sections menolak grup halaman yang kehilangan satu field", () => {
    const { emptyText: _emptyText, ...blogTanpaEmpty } = DEFAULTS.sections.blog;
    const parsed = siteContentSchemas.sections.safeParse({
      ...DEFAULTS.sections,
      blog: blogTanpaEmpty,
    });
    assert.equal(parsed.success, false);
  });

  it("tautan footer menolak path keluar situs", () => {
    const withHref = (href) =>
      siteContentSchemas.footer.safeParse({
        ...DEFAULTS.footer,
        navLinks: [{ label: "Beranda", href }],
      }).success;

    assert.equal(withHref("/#home"), true);
    assert.equal(withHref("/blog"), true);
    assert.equal(withHref("https://contoh.id"), true);
    assert.equal(withHref("//evil.example"), false);
    assert.equal(withHref("javascript:alert(1)"), false);
  });
});

describe("nilai bawaan saat tabel kosong", () => {
  it("buildSiteContent tanpa baris mengembalikan seluruh default", () => {
    const { content, updatedAt } = buildSiteContent();
    assert.deepEqual(Object.keys(content).sort(), [...SITE_CONTENT_KEYS].sort());
    assert.deepEqual(content.site, DEFAULTS.site);
    assert.deepEqual(content.sections, DEFAULTS.sections);
    assert.equal(updatedAt.site, null);
  });

  it("baris sebagian tetap digabung dengan default bertingkat", () => {
    const { content, updatedAt } = buildSiteContent([
      {
        key: "footer",
        content: { description: "Deskripsi baru", social: { facebook: "https://fb.id/x" } },
        updated_at: "2026-10-26T00:00:00.000Z",
      },
      { key: "tidak-dikenal", content: { apa: "saja" } },
    ]);

    assert.equal(content.footer.description, "Deskripsi baru");
    assert.deepEqual(content.footer.social, {
      facebook: "https://fb.id/x",
      instagram: "",
      youtube: "",
    });
    assert.equal(content.footer.navLinks.length, DEFAULTS.footer.navLinks.length);
    assert.equal(updatedAt.footer, "2026-10-26T00:00:00.000Z");
    assert.equal("tidak-dikenal" in content, false);
  });

  it("mergeContentWithDefaults tidak menimpa grup yang tidak dikirim", () => {
    const merged = mergeContentWithDefaults(DEFAULTS.site, { name: "Nama Baru" });
    assert.equal(merged.name, "Nama Baru");
    assert.deepEqual(merged.nav, DEFAULTS.site.nav);
  });
});

describe("format backup dengan key baru", () => {
  it("backup v2 dengan site dan sections diterima", () => {
    const parsed = backupDataSchema.safeParse({
      formatVersion: 2,
      categories: [],
      articles: [],
      siteContent: { site: DEFAULTS.site, sections: DEFAULTS.sections },
    });
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));

    const validated = validateSiteContent(parsed.data.siteContent);
    assert.equal(validated.site.name, DEFAULTS.site.name);
    assert.equal(validated.sections.blog.title, DEFAULTS.sections.blog.title);
  });

  it("backup tanpa key baru tetap valid (kompatibel ke belakang)", () => {
    const validated = validateSiteContent({});
    assert.deepEqual(validated, {});
  });

  it("key tak dikenal di dalam backup ditolak", () => {
    assert.throws(
      () => validateSiteContent({ kunciBaru: { apa: "saja" } }),
      /Kunci konten situs tidak dikenal/,
    );
  });

  it("isi sections yang tidak lengkap di dalam backup ditolak", () => {
    assert.throws(
      () =>
        validateSiteContent({
          sections: { ...DEFAULTS.sections, home: { newsTitle: "Hanya judul" } },
        }),
      /tidak valid di dalam backup/,
    );
  });
});
