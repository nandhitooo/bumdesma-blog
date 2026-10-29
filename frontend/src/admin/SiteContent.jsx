import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";
import { DEFAULT_SITE_CONTENT } from "../lib/defaultContent";
import { useSiteContent } from "../lib/siteContent";
import { isValidIcon } from "../lib/siteContentUtils";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useUnsavedChangesGuard } from "./components/useUnsavedChangesGuard";
import PreviewPanel from "./site-content/PreviewPanel";

function CharCounter({ current = 0, max }) {
  return (
    <span
      className={`text-xs ${
        current > max * 0.9 ? "text-amber-600 font-semibold" : "text-gray-400"
      }`}
    >
      {current} / {max}
    </span>
  );
}

// Bidang gambar yang harus diunggah lewat /api/admin/upload, bukan diketik
// sebagai URL mentah. Nilai kosong berarti situs memakai aset bawaan.
function ImageField({ id, label, value, onChange, previewFallback }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef(null);

  const pickImage = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const data = new FormData();
      data.append("image", file);
      data.append("category", "site");
      const result = await adminApi("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      onChange(result.url);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-gray-700">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : previewFallback ? (
            <img
              src={previewFallback}
              alt=""
              className="h-full w-full object-contain opacity-60"
            />
          ) : (
            <i
              className="fa-solid fa-image text-gray-400"
              aria-hidden="true"
            ></i>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pickImage}
          className="sr-only"
        />
        <label
          htmlFor={id}
          className="inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          {uploading ? "Mengunggah..." : "Pilih gambar"}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="min-h-[44px] cursor-pointer rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100"
          >
            Pakai bawaan
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {value ? value : "Belum ada unggahan; memakai aset bawaan."}
      </p>
      {uploadError && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {uploadError}
        </p>
      )}
    </div>
  );
}

// Grup tautan footer: label + tujuan (path internal atau URL HTTPS).
function LinkGroupEditor({ title, links, onChange, max = 10 }) {
  const update = (index, patch) => {
    const copy = [...links];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  return (
    <div className="pt-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block text-sm font-bold text-gray-700">
            {title} ({links.length} / {max})
          </span>
          <p className="text-xs text-gray-500">
            Tujuan diawali &quot;/&quot; untuk halaman situs ini, atau URL
            https://.
          </p>
        </div>
        <button
          type="button"
          disabled={links.length >= max}
          onClick={() =>
            onChange([...links, { label: "Tautan baru", href: "/" }])
          }
          className="min-h-[44px] shrink-0 cursor-pointer rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-100 disabled:opacity-50"
        >
          + Tambah Tautan
        </button>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 md:grid-cols-12"
          >
            <div className="md:col-span-5">
              <label
                htmlFor={`footer-link-${index}-label`}
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Label
              </label>
              <input
                id={`footer-link-${index}-label`}
                required
                maxLength={80}
                value={link.label}
                onChange={(e) => update(index, { label: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
              />
            </div>
            <div className="md:col-span-6">
              <label
                htmlFor={`footer-link-${index}-href`}
                className="mb-1 block text-xs font-semibold text-gray-600"
              >
                Tujuan
              </label>
              <input
                id={`footer-link-${index}-href`}
                required
                maxLength={300}
                value={link.href}
                onChange={(e) => update(index, { href: e.target.value })}
                placeholder="/#about atau https://..."
                className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <button
                type="button"
                title="Hapus tautan"
                disabled={links.length <= 1}
                onClick={() => onChange(links.filter((_, i) => i !== index))}
                className="flex h-11 w-11 items-center justify-center rounded text-red-600 hover:bg-red-100 disabled:opacity-30"
              >
                <i className="fa-solid fa-trash text-xs" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Susunan field tiap grup `sections`; dipakai untuk merender input secara
// seragam tanpa menulis satu blok JSX per field.
const SECTION_FIELDS = [
  {
    key: "home",
    title: "Beranda — Section Berita",
    fields: [
      { name: "newsEyebrow", label: "Eyebrow", max: 120 },
      { name: "newsTitle", label: "Judul section", max: 200 },
      { name: "newsDescription", label: "Deskripsi", max: 600, textarea: true },
      { name: "newsCta", label: "Teks tombol lihat blog", max: 100 },
      { name: "readMore", label: "Label artikel unggulan", max: 100 },
      { name: "readMoreShort", label: "Label artikel grid", max: 100 },
    ],
  },
  {
    key: "about",
    title: "Tentang",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "profileCta", label: "Teks tombol unduh profil", max: 120 },
    ],
  },
  {
    key: "services",
    title: "Layanan",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul section", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "cta", label: "Teks tautan syarat & alur", max: 120 },
    ],
  },
  {
    key: "activity",
    title: "Kegiatan",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul section", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "cta", label: "Teks tombol galeri", max: 120 },
      { name: "detailLabel", label: "Label tautan detail", max: 100 },
      { name: "galleryCategory", label: "Label kategori foto galeri", max: 60 },
    ],
  },
  {
    key: "contact",
    title: "Kontak",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul section", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "addressTitle", label: "Judul kartu alamat", max: 120 },
      { name: "addressCta", label: "Teks tautan peta", max: 120 },
      { name: "emailTitle", label: "Judul kartu email", max: 120 },
      { name: "emailCta", label: "Teks tautan email", max: 120 },
      { name: "whatsappTitle", label: "Judul kartu WhatsApp", max: 120 },
      { name: "whatsappCta", label: "Teks tautan WhatsApp", max: 120 },
    ],
  },
  {
    key: "blog",
    title: "Halaman Blog",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
  {
    key: "faq",
    title: "Halaman FAQ",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
  {
    key: "gallery",
    title: "Halaman Galeri",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
  {
    key: "team",
    title: "Halaman Pengurus",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
  {
    key: "transparency",
    title: "Halaman Transparansi",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
  {
    key: "serviceList",
    title: "Halaman Daftar Layanan",
    fields: [
      { name: "eyebrow", label: "Eyebrow", max: 120 },
      { name: "title", label: "Judul halaman", max: 200 },
      { name: "description", label: "Deskripsi", max: 600, textarea: true },
      { name: "emptyTitle", label: "Judul saat kosong", max: 200 },
      {
        name: "emptyText",
        label: "Teks saat kosong",
        max: 600,
        textarea: true,
      },
    ],
  },
];

// Satu tab per key site_content. Urutan tab mengikuti alur kerja pengurus:
// identitas dulu, lalu isi beranda sampai teks halaman. `preview` menunjuk
// bagian situs publik yang terpengaruh tab tersebut.
const TABS = [
  { key: "site", label: "Identitas", preview: "/" },
  { key: "hero", label: "Beranda", preview: "/#home" },
  { key: "about", label: "Tentang", preview: "/#about" },
  { key: "vision-mission", label: "Visi & Misi", preview: "/#vision-mission" },
  { key: "services", label: "Layanan", preview: "/#services" },
  { key: "contact", label: "Kontak", preview: "/#contact" },
  { key: "footer", label: "Footer", preview: "/" },
  { key: "sections", label: "Teks Halaman", preview: "/blog" },
];

const FORM_KEYS = [
  "hero",
  "about",
  "vision-mission",
  "services",
  "contact",
  "footer",
  "site",
  "sections",
];

// Urutan key objek berubah setelah round-trip jsonb di PostgreSQL, jadi
// perbandingan harus tidak peka urutan key.
function stableStringify(value) {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
    return val;
  });
}

const NAV_FIELDS = [
  { name: "home", label: "Beranda" },
  { name: "about", label: "Tentang" },
  { name: "vision-mission", label: "Visi & Misi" },
  { name: "services", label: "Layanan" },
  { name: "activity", label: "Kegiatan" },
  { name: "contact", label: "Kontak" },
  { name: "blog", label: "Blog" },
  { name: "gallery", label: "Galeri" },
  { name: "transparency", label: "Transparansi" },
  { name: "team", label: "Pengurus" },
  { name: "more", label: "Tombol menu Lainnya" },
];

export default function SiteContent() {
  const { user } = useOutletContext();
  const { refreshContent } = useSiteContent();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState("site");
  // Pratinjau langsung: iframe hanya dipasang selama panel terbuka.
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewTrigger = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState({});

  // Individual section states
  const [heroForm, setHeroForm] = useState(DEFAULT_SITE_CONTENT.hero);
  const [aboutForm, setAboutForm] = useState(DEFAULT_SITE_CONTENT.about);
  const [visionMissionForm, setVisionMissionForm] = useState(
    DEFAULT_SITE_CONTENT["vision-mission"],
  );
  const [servicesForm, setServicesForm] = useState(
    DEFAULT_SITE_CONTENT.services,
  );
  const [contactForm, setContactForm] = useState(DEFAULT_SITE_CONTENT.contact);
  const [footerForm, setFooterForm] = useState(DEFAULT_SITE_CONTENT.footer);
  const [siteForm, setSiteForm] = useState(DEFAULT_SITE_CONTENT.site);
  const [sectionsForm, setSectionsForm] = useState(
    DEFAULT_SITE_CONTENT.sections,
  );
  // Cuplikan isi tiap form saat terakhir dimuat/disimpan. Dipakai untuk
  // menandai tab yang belum disimpan tanpa perlu menyimpan salinan objek form.
  const [baseline, setBaseline] = useState(null);

  // Status per section: { saving: bool, error: string, success: string }
  const [status, setStatus] = useState({
    hero: { saving: false, error: "", success: "" },
    about: { saving: false, error: "", success: "" },
    "vision-mission": { saving: false, error: "", success: "" },
    services: { saving: false, error: "", success: "" },
    contact: { saving: false, error: "", success: "" },
    footer: { saving: false, error: "", success: "" },
    site: { saving: false, error: "", success: "" },
    sections: { saving: false, error: "", success: "" },
  });

  const setSectionStatus = (key, updates) => {
    setStatus((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    // Layar penolakan itu di-render sebelum status loading dibaca, jadi tidak
    // perlu menyentuh state loading di sini.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/site-content")
      .then((data) => {
        if (!active) return;
        const loaded = {
          hero: data?.content?.hero || DEFAULT_SITE_CONTENT.hero,
          about: data?.content?.about || DEFAULT_SITE_CONTENT.about,
          "vision-mission":
            data?.content?.["vision-mission"] ||
            DEFAULT_SITE_CONTENT["vision-mission"],
          services: data?.content?.services || DEFAULT_SITE_CONTENT.services,
          contact: data?.content?.contact || DEFAULT_SITE_CONTENT.contact,
          footer: data?.content?.footer || DEFAULT_SITE_CONTENT.footer,
          site: data?.content?.site || DEFAULT_SITE_CONTENT.site,
          sections: data?.content?.sections || DEFAULT_SITE_CONTENT.sections,
        };
        setHeroForm(loaded.hero);
        setAboutForm(loaded.about);
        setVisionMissionForm(loaded["vision-mission"]);
        setServicesForm(loaded.services);
        setContactForm(loaded.contact);
        setFooterForm(loaded.footer);
        setSiteForm(loaded.site);
        setSectionsForm(loaded.sections);
        setBaseline(
          Object.fromEntries(
            FORM_KEYS.map((key) => [key, stableStringify(loaded[key])]),
          ),
        );
        if (data?.updatedAt) {
          setUpdatedAt(data.updatedAt);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || "Gagal memuat konten situs.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.role]);

  // Perubahan tiap tab dibanding cuplikan terakhir yang dimuat/disimpan.
  const forms = {
    hero: heroForm,
    about: aboutForm,
    "vision-mission": visionMissionForm,
    services: servicesForm,
    contact: contactForm,
    footer: footerForm,
    site: siteForm,
    sections: sectionsForm,
  };
  const isDirty = (key) =>
    Boolean(baseline) && stableStringify(forms[key]) !== baseline[key];
  const dirtyTabs = TABS.filter((tab) => isDirty(tab.key));

  // Peringatan saat pindah halaman/menutup tab selama masih ada perubahan.
  // Dipanggil sebelum layar penolakan agar urutan hook tetap sama di setiap render.
  useUnsavedChangesGuard(
    dirtyTabs.length > 0,
    "Ada perubahan konten situs yang belum disimpan. Tinggalkan halaman ini?",
  );

  if (user.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Pengelolaan konten situs hanya tersedia untuk admin.
      </p>
    );
  }

  const handleSave = async (key, payload) => {
    setSectionStatus(key, { saving: true, error: "", success: "" });
    try {
      const res = await adminApi(`/api/admin/site-content/${key}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res?.updatedAt) {
        setUpdatedAt((prev) => ({ ...prev, [key]: res.updatedAt }));
      }
      if (res?.content) {
        const applyToForm = {
          hero: setHeroForm,
          about: setAboutForm,
          "vision-mission": setVisionMissionForm,
          services: setServicesForm,
          contact: setContactForm,
          footer: setFooterForm,
          site: setSiteForm,
          sections: setSectionsForm,
        }[key];
        applyToForm?.(res.content);
      }
      setBaseline((prev) => ({
        ...prev,
        [key]: stableStringify(res?.content ?? payload),
      }));
      setSectionStatus(key, {
        saving: false,
        error: "",
        success: "Perubahan berhasil disimpan.",
      });
      refreshContent();
    } catch (err) {
      setSectionStatus(key, {
        saving: false,
        error: err.message || "Gagal menyimpan perubahan.",
        success: "",
      });
    }
  };

  const handleReset = async (key) => {
    const sectionNames = {
      hero: "Hero (Beranda Utama)",
      about: "Tentang",
      "vision-mission": "Visi & Misi",
      services: "Layanan",
      contact: "Kontak",
      footer: "Footer",
      site: "Identitas Situs & SEO",
      sections: "Judul Section & Halaman",
    };
    const confirmed = await confirm({
      title: "Kembalikan ke bawaan?",
      message:
        "Isi bagian ini akan diganti dengan teks bawaan. Semua perubahan Anda pada bagian ini akan hilang.",
      detail: sectionNames[key],
      confirmLabel: "Kembalikan ke bawaan",
    });
    if (!confirmed) return;

    setSectionStatus(key, { saving: true, error: "", success: "" });
    try {
      await adminApi(`/api/admin/site-content/${key}`, { method: "DELETE" });
      const defaultData = DEFAULT_SITE_CONTENT[key];
      if (key === "hero") setHeroForm(defaultData);
      if (key === "about") setAboutForm(defaultData);
      if (key === "vision-mission") setVisionMissionForm(defaultData);
      if (key === "services") setServicesForm(defaultData);
      if (key === "contact") setContactForm(defaultData);
      if (key === "footer") setFooterForm(defaultData);
      if (key === "site") setSiteForm(defaultData);
      if (key === "sections") setSectionsForm(defaultData);

      setBaseline((prev) => ({ ...prev, [key]: stableStringify(defaultData) }));
      setUpdatedAt((prev) => ({ ...prev, [key]: null }));
      setSectionStatus(key, {
        saving: false,
        error: "",
        success: "Bagian berhasil dikembalikan ke pengaturan bawaan.",
      });
      refreshContent();
    } catch (err) {
      setSectionStatus(key, {
        saving: false,
        error: err.message || "Gagal mengembalikan ke bawaan.",
        success: "",
      });
    }
  };

  const updateSectionField = (group, name, value) => {
    setSectionsForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [name]: value },
    }));
  };

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab) || TABS[0];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-sm">
        <LoadingSkeleton rows={5} label="Memuat data konten situs..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Situs"
        title="Konten Situs"
        description="Kelola teks, gambar, dan tautan yang tampil di situs publik. Pilih bagian lewat tab, lalu simpan tab tersebut."
      >
        <button
          ref={previewTrigger}
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-expanded={previewOpen}
          aria-controls="site-content-preview"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800 motion-reduce:transition-none"
        >
          <i className="fa-solid fa-eye" aria-hidden="true"></i>
          <span>Pratinjau</span>
        </button>
        <a
          href={activeTabConfig.preview}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 motion-reduce:transition-none"
        >
          <span>Lihat di situs</span>
          <i
            className="fa-solid fa-arrow-up-right-from-square text-xs"
            aria-hidden="true"
          ></i>
        </a>
      </PageHeader>

      <nav
        aria-label="Bagian konten situs"
        className="overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm"
      >
        <ul className="flex min-w-max gap-1">
          {TABS.map((tab) => (
            <li key={tab.key}>
              <button
                type="button"
                aria-pressed={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition motion-reduce:transition-none ${
                  activeTab === tab.key
                    ? "bg-green-700 text-white"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                {tab.label}
                {isDirty(tab.key) && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeTab === tab.key ? "bg-amber-300" : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                  ></span>
                )}
                {isDirty(tab.key) && (
                  <span className="sr-only">(belum disimpan)</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {dirtyTabs.length > 0 && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-bold">Ada perubahan yang belum disimpan.</p>
          <p className="mt-1 break-words">
            Bagian: {dirtyTabs.map((tab) => tab.label).join(", ")}. Buka tabnya
            lalu tekan tombol Simpan di bagian bawah formulir.
          </p>
        </div>
      )}

      {loadError && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 p-5 text-sm text-red-700"
        >
          {loadError}
        </p>
      )}

      {/* ========================================================================= */}
      {/* Hero (Beranda) */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "hero"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Hero (Beranda Utama)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Judul utama, deskripsi pengantar, tombol aksi, dan poin sorotan
              BUMDESMA.
            </p>
          </div>
          {updatedAt.hero && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.hero))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("hero", heroForm);
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="hero-subtitle"
                className="block text-sm font-bold text-gray-700"
              >
                Sub-judul (Kop Kecil)
              </label>
              <CharCounter current={heroForm.subtitle?.length} max={200} />
            </div>
            <input
              id="hero-subtitle"
              required
              maxLength={200}
              value={heroForm.subtitle || ""}
              onChange={(e) =>
                setHeroForm({ ...heroForm, subtitle: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="hero-title"
                className="block text-sm font-bold text-gray-700"
              >
                Judul Utama
              </label>
              <CharCounter current={heroForm.title?.length} max={200} />
            </div>
            <input
              id="hero-title"
              required
              maxLength={200}
              value={heroForm.title || ""}
              onChange={(e) =>
                setHeroForm({ ...heroForm, title: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="hero-desc"
                className="block text-sm font-bold text-gray-700"
              >
                Deskripsi
              </label>
              <CharCounter current={heroForm.description?.length} max={1000} />
            </div>
            <textarea
              id="hero-desc"
              required
              rows={3}
              maxLength={1000}
              value={heroForm.description || ""}
              onChange={(e) =>
                setHeroForm({ ...heroForm, description: e.target.value })
              }
              className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="hero-btn"
                className="block text-sm font-bold text-gray-700"
              >
                Teks Tombol Aksi
              </label>
              <CharCounter current={heroForm.buttonLabel?.length} max={100} />
            </div>
            <input
              id="hero-btn"
              required
              maxLength={100}
              value={heroForm.buttonLabel || ""}
              onChange={(e) =>
                setHeroForm({ ...heroForm, buttonLabel: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <ImageField
            id="hero-image"
            label="Gambar Hero (opsional)"
            value={heroForm.imageUrl || ""}
            onChange={(url) => setHeroForm({ ...heroForm, imageUrl: url })}
          />

          {/* Repeatable Highlights */}
          <div className="pt-4 border-t border-gray-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Sorotan Hero (Highlights: {heroForm.highlights?.length || 0} /
                  6)
                </h3>
                <p className="text-xs text-gray-500">
                  Minimal 1, maksimal 6 sorotan.
                </p>
              </div>
              <button
                type="button"
                disabled={(heroForm.highlights?.length || 0) >= 6}
                onClick={() => {
                  const current = heroForm.highlights || [];
                  if (current.length < 6) {
                    setHeroForm({
                      ...heroForm,
                      highlights: [
                        ...current,
                        {
                          icon: "star",
                          title: "Sorotan Baru",
                          desc: "Deskripsi sorotan baru.",
                        },
                      ],
                    });
                  }
                }}
                className="min-h-[44px] shrink-0 cursor-pointer rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-100 disabled:opacity-50"
              >
                + Tambah Sorotan
              </button>
            </div>

            <div className="space-y-4">
              {heroForm.highlights?.map((hl, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-600">
                      Sorotan #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Geser ke atas"
                        disabled={index === 0}
                        onClick={() => {
                          const copy = [...heroForm.highlights];
                          const temp = copy[index - 1];
                          copy[index - 1] = copy[index];
                          copy[index] = temp;
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Geser ke bawah"
                        disabled={index === heroForm.highlights.length - 1}
                        onClick={() => {
                          const copy = [...heroForm.highlights];
                          const temp = copy[index + 1];
                          copy[index + 1] = copy[index];
                          copy[index] = temp;
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Hapus sorotan"
                        disabled={heroForm.highlights.length <= 1}
                        onClick={() => {
                          const copy = heroForm.highlights.filter(
                            (_, i) => i !== index,
                          );
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <label
                        htmlFor={`hero-highlight-${index}-icon`}
                        className="block text-xs font-semibold text-gray-600 mb-1"
                      >
                        Nama Ikon (FontAwesome tanpa fa-)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-brand-primary shrink-0">
                          {isValidIcon(hl.icon) ? (
                            <i
                              className={`fa-solid fa-${hl.icon}`}
                              aria-hidden="true"
                            ></i>
                          ) : (
                            <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
                          )}
                        </div>
                        <input
                          id={`hero-highlight-${index}-icon`}
                          required
                          maxLength={40}
                          value={hl.icon}
                          onChange={(e) => {
                            const copy = [...heroForm.highlights];
                            copy[index] = {
                              ...copy[index],
                              icon: e.target.value.toLowerCase().trim(),
                            };
                            setHeroForm({ ...heroForm, highlights: copy });
                          }}
                          placeholder="mis. calendar-check"
                          className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-8">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`hero-highlight-${index}-title`}
                          className="block text-xs font-semibold text-gray-600"
                        >
                          Judul Sorotan
                        </label>
                        <CharCounter current={hl.title?.length} max={120} />
                      </div>
                      <input
                        id={`hero-highlight-${index}-title`}
                        required
                        maxLength={120}
                        value={hl.title}
                        onChange={(e) => {
                          const copy = [...heroForm.highlights];
                          copy[index] = {
                            ...copy[index],
                            title: e.target.value,
                          };
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={`hero-highlight-${index}-desc`}
                        className="block text-xs font-semibold text-gray-600"
                      >
                        Deskripsi
                      </label>
                      <CharCounter current={hl.desc?.length} max={500} />
                    </div>
                    <textarea
                      id={`hero-highlight-${index}-desc`}
                      required
                      rows={2}
                      maxLength={500}
                      value={hl.desc}
                      onChange={(e) => {
                        const copy = [...heroForm.highlights];
                        copy[index] = { ...copy[index], desc: e.target.value };
                        setHeroForm({ ...heroForm, highlights: copy });
                      }}
                      className="min-h-[44px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert / Status */}
          {status.hero.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.hero.error}
            </p>
          )}
          {status.hero.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.hero.success}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.hero.saving}
              onClick={() => handleReset("hero")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.hero.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.hero.saving ? "Menyimpan..." : "Simpan Hero"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Tentang */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "about"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Tentang (Profil Lembaga)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Judul bagian, teks lokasi, paragraf profil, dan tautan dokumen
              profil resmi. Visi & Misi diatur di tabnya sendiri.
            </p>
          </div>
          {updatedAt.about && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.about))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("about", aboutForm);
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="about-heading"
                className="block text-sm font-bold text-gray-700"
              >
                Judul Utama Bagian
              </label>
              <CharCounter current={aboutForm.heading?.length} max={200} />
            </div>
            <input
              id="about-heading"
              required
              maxLength={200}
              value={aboutForm.heading || ""}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, heading: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="about-location"
                className="block text-sm font-bold text-gray-700"
              >
                Lokasi / Sub-judul
              </label>
              <CharCounter current={aboutForm.location?.length} max={300} />
            </div>
            <input
              id="about-location"
              required
              maxLength={300}
              value={aboutForm.location || ""}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, location: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          {/* Repeatable Paragraphs */}
          <div className="pt-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-700">
                  Paragraf Tentang ({aboutForm.paragraphs?.length || 0} / 6)
                </label>
                <p className="text-xs text-gray-500">
                  Minimal 1, maksimal 6 paragraf.
                </p>
              </div>
              <button
                type="button"
                disabled={(aboutForm.paragraphs?.length || 0) >= 6}
                onClick={() => {
                  const current = aboutForm.paragraphs || [];
                  if (current.length < 6) {
                    setAboutForm({
                      ...aboutForm,
                      paragraphs: [...current, "Paragraf baru."],
                    });
                  }
                }}
                className="min-h-[44px] shrink-0 cursor-pointer rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-100 disabled:opacity-50"
              >
                + Tambah Paragraf
              </button>
            </div>

            <div className="space-y-3">
              {aboutForm.paragraphs?.map((para, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor={`about-paragraph-${index}`}
                      className="text-xs font-bold text-gray-600"
                    >
                      Paragraf #{index + 1}
                    </label>
                    <div className="flex items-center gap-1">
                      <CharCounter current={para?.length} max={2000} />
                      <button
                        type="button"
                        title="Geser ke atas"
                        disabled={index === 0}
                        onClick={() => {
                          const copy = [...aboutForm.paragraphs];
                          const temp = copy[index - 1];
                          copy[index - 1] = copy[index];
                          copy[index] = temp;
                          setAboutForm({ ...aboutForm, paragraphs: copy });
                        }}
                        className="ml-2 flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Geser ke bawah"
                        disabled={index === aboutForm.paragraphs.length - 1}
                        onClick={() => {
                          const copy = [...aboutForm.paragraphs];
                          const temp = copy[index + 1];
                          copy[index + 1] = copy[index];
                          copy[index] = temp;
                          setAboutForm({ ...aboutForm, paragraphs: copy });
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Hapus paragraf"
                        disabled={aboutForm.paragraphs.length <= 1}
                        onClick={() => {
                          const copy = aboutForm.paragraphs.filter(
                            (_, i) => i !== index,
                          );
                          setAboutForm({ ...aboutForm, paragraphs: copy });
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <textarea
                    id={`about-paragraph-${index}`}
                    required
                    rows={3}
                    maxLength={2000}
                    value={para}
                    onChange={(e) => {
                      const copy = [...aboutForm.paragraphs];
                      copy[index] = e.target.value;
                      setAboutForm({ ...aboutForm, paragraphs: copy });
                    }}
                    className="min-h-[44px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="about-profile-url"
                className="block text-sm font-bold text-gray-700"
              >
                URL Dokumen Profil (Wajib HTTPS)
              </label>
              <CharCounter current={aboutForm.profileUrl?.length} max={2048} />
            </div>
            <input
              id="about-profile-url"
              type="url"
              required
              maxLength={2048}
              value={aboutForm.profileUrl || ""}
              onChange={(e) =>
                setAboutForm({ ...aboutForm, profileUrl: e.target.value })
              }
              placeholder="https://..."
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          {/* Alert / Status */}
          {status.about.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.about.error}
            </p>
          )}
          {status.about.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.about.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.about.saving}
              onClick={() => handleReset("about")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.about.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.about.saving ? "Menyimpan..." : "Simpan Tentang"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Visi & Misi */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "vision-mission"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Visi & Misi</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Judul section, label, teks visi, dan butir misi yang tampil di
              bagian Visi & Misi pada beranda.
            </p>
          </div>
          {updatedAt["vision-mission"] && (
            <span className="text-xs text-gray-400">
              Diperbarui:{" "}
              {dateFormatter.format(new Date(updatedAt["vision-mission"]))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("vision-mission", visionMissionForm);
          }}
          className="mt-6 space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: "eyebrow", label: "Eyebrow", max: 120 },
              { name: "title", label: "Judul section", max: 200 },
              { name: "visionLabel", label: "Label visi", max: 60 },
              { name: "missionLabel", label: "Label misi", max: 60 },
            ].map((field) => (
              <div key={field.name}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor={`vision-mission-${field.name}`}
                    className="block text-sm font-bold text-gray-700"
                  >
                    {field.label}
                  </label>
                  <CharCounter
                    current={visionMissionForm[field.name]?.length}
                    max={field.max}
                  />
                </div>
                <input
                  id={`vision-mission-${field.name}`}
                  required
                  maxLength={field.max}
                  value={visionMissionForm[field.name] || ""}
                  onChange={(e) =>
                    setVisionMissionForm({
                      ...visionMissionForm,
                      [field.name]: e.target.value,
                    })
                  }
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                />
              </div>
            ))}
          </div>

          {/* Visi */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="vision-mission-text"
                className="block text-sm font-bold text-gray-700"
              >
                Teks Visi (opsional)
              </label>
              <CharCounter
                current={visionMissionForm.vision?.length}
                max={500}
              />
            </div>
            <textarea
              id="vision-mission-text"
              rows={3}
              maxLength={500}
              value={visionMissionForm.vision || ""}
              onChange={(e) =>
                setVisionMissionForm({
                  ...visionMissionForm,
                  vision: e.target.value,
                })
              }
              className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          {/* Misi */}
          <div className="pt-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-700">
                  Misi ({visionMissionForm.missions?.length || 0} / 8)
                </label>
                <p className="text-xs text-gray-500">
                  Opsional, maksimal 8 butir.
                </p>
              </div>
              <button
                type="button"
                disabled={(visionMissionForm.missions?.length || 0) >= 8}
                onClick={() => {
                  const current = visionMissionForm.missions || [];
                  if (current.length < 8) {
                    setVisionMissionForm({
                      ...visionMissionForm,
                      missions: [...current, ""],
                    });
                  }
                }}
                className="min-h-[44px] shrink-0 cursor-pointer rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-100 disabled:opacity-50"
              >
                + Tambah Misi
              </button>
            </div>

            <div className="space-y-3">
              {(visionMissionForm.missions || []).map((mission, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor={`vision-mission-mission-${index}`}
                      className="text-xs font-bold text-gray-600"
                    >
                      Misi #{index + 1}
                    </label>
                    <div className="flex items-center gap-1">
                      <CharCounter current={mission?.length} max={300} />
                      <button
                        type="button"
                        title="Hapus misi"
                        onClick={() => {
                          const copy = visionMissionForm.missions.filter(
                            (_, i) => i !== index,
                          );
                          setVisionMissionForm({
                            ...visionMissionForm,
                            missions: copy,
                          });
                        }}
                        className="ml-2 flex h-11 w-11 items-center justify-center rounded hover:bg-red-100 text-red-600 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <textarea
                    id={`vision-mission-mission-${index}`}
                    required
                    rows={2}
                    maxLength={300}
                    value={mission}
                    onChange={(e) => {
                      const copy = [...visionMissionForm.missions];
                      copy[index] = e.target.value;
                      setVisionMissionForm({
                        ...visionMissionForm,
                        missions: copy,
                      });
                    }}
                    className="min-h-[44px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {status["vision-mission"].error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status["vision-mission"].error}
            </p>
          )}
          {status["vision-mission"].success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status["vision-mission"].success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status["vision-mission"].saving}
              onClick={() => handleReset("vision-mission")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status["vision-mission"].saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status["vision-mission"].saving
                ? "Menyimpan..."
                : "Simpan Visi & Misi"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Layanan */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "services"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Layanan</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Unit usaha dan layanan yang ditawarkan BUMDESMA kepada masyarakat.
            </p>
          </div>
          {updatedAt.services && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.services))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("services", servicesForm);
          }}
          className="mt-6 space-y-5"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-sm font-bold text-gray-800">
                Daftar Layanan ({servicesForm.items?.length || 0} / 12)
              </span>
              <p className="text-xs text-gray-500">
                Minimal 1, maksimal 12 layanan usaha.
              </p>
            </div>
            <button
              type="button"
              disabled={(servicesForm.items?.length || 0) >= 12}
              onClick={() => {
                const current = servicesForm.items || [];
                if (current.length < 12) {
                  setServicesForm({
                    ...servicesForm,
                    items: [
                      ...current,
                      {
                        icon: "gear",
                        title: "Layanan Baru",
                        desc: "Deskripsi layanan baru.",
                      },
                    ],
                  });
                }
              }}
              className="min-h-[44px] shrink-0 cursor-pointer rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-100 disabled:opacity-50"
            >
              + Tambah Layanan
            </button>
          </div>

          <div className="space-y-4">
            {servicesForm.items?.map((srv, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-600">
                    Layanan #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Geser ke atas"
                      disabled={index === 0}
                      onClick={() => {
                        const copy = [...servicesForm.items];
                        const temp = copy[index - 1];
                        copy[index - 1] = copy[index];
                        copy[index] = temp;
                        setServicesForm({ ...servicesForm, items: copy });
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-up text-xs"></i>
                    </button>
                    <button
                      type="button"
                      title="Geser ke bawah"
                      disabled={index === servicesForm.items.length - 1}
                      onClick={() => {
                        const copy = [...servicesForm.items];
                        const temp = copy[index + 1];
                        copy[index + 1] = copy[index];
                        copy[index] = temp;
                        setServicesForm({ ...servicesForm, items: copy });
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-down text-xs"></i>
                    </button>
                    <button
                      type="button"
                      title="Hapus layanan"
                      disabled={servicesForm.items.length <= 1}
                      onClick={() => {
                        const copy = servicesForm.items.filter(
                          (_, i) => i !== index,
                        );
                        setServicesForm({ ...servicesForm, items: copy });
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label
                      htmlFor={`service-${index}-icon`}
                      className="block text-xs font-semibold text-gray-600 mb-1"
                    >
                      Nama Ikon (tanpa fa-)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-brand-primary shrink-0">
                        {isValidIcon(srv.icon) ? (
                          <i
                            className={`fa-solid fa-${srv.icon}`}
                            aria-hidden="true"
                          ></i>
                        ) : (
                          <i className="fa-solid fa-gear text-gray-400"></i>
                        )}
                      </div>
                      <input
                        id={`service-${index}-icon`}
                        required
                        maxLength={40}
                        value={srv.icon}
                        onChange={(e) => {
                          const copy = [...servicesForm.items];
                          copy[index] = {
                            ...copy[index],
                            icon: e.target.value.toLowerCase().trim(),
                          };
                          setServicesForm({ ...servicesForm, items: copy });
                        }}
                        placeholder="mis. coins"
                        className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={`service-${index}-title`}
                        className="block text-xs font-semibold text-gray-600"
                      >
                        Nama Layanan
                      </label>
                      <CharCounter current={srv.title?.length} max={120} />
                    </div>
                    <input
                      id={`service-${index}-title`}
                      required
                      maxLength={120}
                      value={srv.title}
                      onChange={(e) => {
                        const copy = [...servicesForm.items];
                        copy[index] = { ...copy[index], title: e.target.value };
                        setServicesForm({ ...servicesForm, items: copy });
                      }}
                      className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`service-${index}-desc`}
                      className="block text-xs font-semibold text-gray-600"
                    >
                      Deskripsi Layanan
                    </label>
                    <CharCounter current={srv.desc?.length} max={500} />
                  </div>
                  <textarea
                    id={`service-${index}-desc`}
                    required
                    rows={2}
                    maxLength={500}
                    value={srv.desc}
                    onChange={(e) => {
                      const copy = [...servicesForm.items];
                      copy[index] = { ...copy[index], desc: e.target.value };
                      setServicesForm({ ...servicesForm, items: copy });
                    }}
                    className="min-h-[44px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-base outline-none focus:border-green-700"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Alert / Status */}
          {status.services.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.services.error}
            </p>
          )}
          {status.services.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.services.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.services.saving}
              onClick={() => handleReset("services")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.services.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.services.saving ? "Menyimpan..." : "Simpan Layanan"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Kontak */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "contact"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kontak & Lokasi</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Alamat operasional kantor, surel, kontak WhatsApp, dan peta Google
              Maps.
            </p>
          </div>
          {updatedAt.contact && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.contact))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("contact", contactForm);
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="contact-address"
                className="block text-sm font-bold text-gray-700"
              >
                Alamat Lengkap Kantor
              </label>
              <CharCounter current={contactForm.address?.length} max={500} />
            </div>
            <textarea
              id="contact-address"
              required
              rows={2}
              maxLength={500}
              value={contactForm.address || ""}
              onChange={(e) =>
                setContactForm({ ...contactForm, address: e.target.value })
              }
              className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-bold text-gray-700"
                >
                  Surat Elektronik (Email)
                </label>
                <CharCounter current={contactForm.email?.length} max={254} />
              </div>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={contactForm.email || ""}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="contact-whatsapp-display"
                  className="block text-sm font-bold text-gray-700"
                >
                  Tampilan Nomor WhatsApp
                </label>
                <CharCounter
                  current={contactForm.whatsappDisplay?.length}
                  max={40}
                />
              </div>
              <input
                id="contact-whatsapp-display"
                required
                maxLength={40}
                value={contactForm.whatsappDisplay || ""}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    whatsappDisplay: e.target.value,
                  })
                }
                placeholder="+62 851-5616-2917"
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="contact-whatsapp"
                className="block text-sm font-bold text-gray-700"
              >
                Nomor WhatsApp (Hanya 8–15 Digit Angka, mis. 6285156162917)
              </label>
              <CharCounter current={contactForm.whatsapp?.length} max={15} />
            </div>
            <input
              id="contact-whatsapp"
              required
              pattern="^\d{8,15}$"
              maxLength={15}
              value={contactForm.whatsapp || ""}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  whatsapp: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="6285156162917"
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="contact-maps-link"
                className="block text-sm font-bold text-gray-700"
              >
                Tautan Google Maps (HTTPS URL)
              </label>
              <CharCounter current={contactForm.mapsLink?.length} max={2048} />
            </div>
            <input
              id="contact-maps-link"
              type="url"
              required
              maxLength={2048}
              value={contactForm.mapsLink || ""}
              onChange={(e) =>
                setContactForm({ ...contactForm, mapsLink: e.target.value })
              }
              placeholder="https://maps.app.goo.gl/..."
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="contact-maps-embed"
                className="block text-sm font-bold text-gray-700"
              >
                URL Embed Google Maps (Harus diawali
                https://www.google.com/maps/embed)
              </label>
              <CharCounter
                current={contactForm.mapsEmbedUrl?.length}
                max={2048}
              />
            </div>
            <input
              id="contact-maps-embed"
              type="url"
              required
              maxLength={2048}
              value={contactForm.mapsEmbedUrl || ""}
              onChange={(e) =>
                setContactForm({ ...contactForm, mapsEmbedUrl: e.target.value })
              }
              placeholder="https://www.google.com/maps/embed?..."
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          {/* Alert / Status */}
          {status.contact.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.contact.error}
            </p>
          )}
          {status.contact.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.contact.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.contact.saving}
              onClick={() => handleReset("contact")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.contact.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.contact.saving ? "Menyimpan..." : "Simpan Kontak"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Footer */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "footer"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Footer</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Deskripsi penutup, kontak ringkas kantor, dan tautan jejaring
              media sosial.
            </p>
          </div>
          {updatedAt.footer && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.footer))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("footer", footerForm);
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="footer-desc"
                className="block text-sm font-bold text-gray-700"
              >
                Deskripsi Singkat Footer
              </label>
              <CharCounter
                current={footerForm.description?.length}
                max={1000}
              />
            </div>
            <textarea
              id="footer-desc"
              required
              rows={3}
              maxLength={1000}
              value={footerForm.description || ""}
              onChange={(e) =>
                setFooterForm({ ...footerForm, description: e.target.value })
              }
              className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="footer-address"
                className="block text-sm font-bold text-gray-700"
              >
                Alamat Ringkas
              </label>
              <CharCounter current={footerForm.address?.length} max={500} />
            </div>
            <input
              id="footer-address"
              required
              maxLength={500}
              value={footerForm.address || ""}
              onChange={(e) =>
                setFooterForm({ ...footerForm, address: e.target.value })
              }
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-phone"
                  className="block text-sm font-bold text-gray-700"
                >
                  Nomor Telepon
                </label>
                <CharCounter current={footerForm.phone?.length} max={40} />
              </div>
              <input
                id="footer-phone"
                required
                maxLength={40}
                value={footerForm.phone || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, phone: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-email"
                  className="block text-sm font-bold text-gray-700"
                >
                  Email
                </label>
                <CharCounter current={footerForm.email?.length} max={254} />
              </div>
              <input
                id="footer-email"
                type="email"
                required
                maxLength={254}
                value={footerForm.email || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, email: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-3 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">
              Media Sosial (Opsional - Kosongkan jika tidak ada)
            </h3>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="footer-fb"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Facebook URL (HTTPS)
                </label>
                <input
                  id="footer-fb"
                  type="url"
                  maxLength={2048}
                  value={footerForm.social?.facebook || ""}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social: {
                        ...footerForm.social,
                        facebook: e.target.value,
                      },
                    })
                  }
                  placeholder="https://facebook.com/..."
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label
                  htmlFor="footer-ig"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Instagram URL (HTTPS)
                </label>
                <input
                  id="footer-ig"
                  type="url"
                  maxLength={2048}
                  value={footerForm.social?.instagram || ""}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social: {
                        ...footerForm.social,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="https://instagram.com/..."
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label
                  htmlFor="footer-yt"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  YouTube URL (HTTPS)
                </label>
                <input
                  id="footer-yt"
                  type="url"
                  maxLength={2048}
                  value={footerForm.social?.youtube || ""}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      social: { ...footerForm.social, youtube: e.target.value },
                    })
                  }
                  placeholder="https://youtube.com/..."
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                />
              </div>
            </div>
          </div>

          {/* Judul kolom dan grup tautan */}
          <div className="grid grid-cols-1 gap-5 pt-3 border-t border-gray-100 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-brand-tagline"
                  className="block text-sm font-bold text-gray-700"
                >
                  Sub-judul Merek
                </label>
                <CharCounter
                  current={footerForm.brandTagline?.length}
                  max={160}
                />
              </div>
              <input
                id="footer-brand-tagline"
                required
                maxLength={160}
                value={footerForm.brandTagline || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, brandTagline: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-legal-note"
                  className="block text-sm font-bold text-gray-700"
                >
                  Catatan Badan Hukum
                </label>
                <CharCounter current={footerForm.legalNote?.length} max={200} />
              </div>
              <input
                id="footer-legal-note"
                required
                maxLength={200}
                value={footerForm.legalNote || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, legalNote: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-nav-heading"
                  className="block text-sm font-bold text-gray-700"
                >
                  Judul Kolom Navigasi
                </label>
                <CharCounter
                  current={footerForm.navHeading?.length}
                  max={120}
                />
              </div>
              <input
                id="footer-nav-heading"
                required
                maxLength={120}
                value={footerForm.navHeading || ""}
                onChange={(e) =>
                  setFooterForm({ ...footerForm, navHeading: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-services-heading"
                  className="block text-sm font-bold text-gray-700"
                >
                  Judul Kolom Unit Layanan
                </label>
                <CharCounter
                  current={footerForm.servicesHeading?.length}
                  max={120}
                />
              </div>
              <input
                id="footer-services-heading"
                required
                maxLength={120}
                value={footerForm.servicesHeading || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    servicesHeading: e.target.value,
                  })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="footer-contact-heading"
                  className="block text-sm font-bold text-gray-700"
                >
                  Judul Kolom Kontak
                </label>
                <CharCounter
                  current={footerForm.contactHeading?.length}
                  max={120}
                />
              </div>
              <input
                id="footer-contact-heading"
                required
                maxLength={120}
                value={footerForm.contactHeading || ""}
                onChange={(e) =>
                  setFooterForm({
                    ...footerForm,
                    contactHeading: e.target.value,
                  })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>
          </div>

          <LinkGroupEditor
            title="Tautan Navigasi Footer"
            links={footerForm.navLinks || []}
            onChange={(links) =>
              setFooterForm({ ...footerForm, navLinks: links })
            }
          />

          <LinkGroupEditor
            title="Tautan Unit Layanan Footer"
            links={footerForm.serviceLinks || []}
            onChange={(links) =>
              setFooterForm({ ...footerForm, serviceLinks: links })
            }
          />

          {/* Alert / Status */}
          {status.footer.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.footer.error}
            </p>
          )}
          {status.footer.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.footer.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.footer.saving}
              onClick={() => handleReset("footer")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.footer.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.footer.saving ? "Menyimpan..." : "Simpan Footer"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Identitas Situs & SEO */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "site"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Identitas Situs & SEO
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Nama lembaga, logo, label menu, judul tab, serta meta deskripsi
              dan feed.
            </p>
          </div>
          {updatedAt.site && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.site))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("site", siteForm);
          }}
          className="mt-6 space-y-5"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-name"
                  className="block text-sm font-bold text-gray-700"
                >
                  Nama Lembaga
                </label>
                <CharCounter current={siteForm.name?.length} max={120} />
              </div>
              <input
                id="site-name"
                required
                maxLength={120}
                value={siteForm.name || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, name: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-legal-name"
                  className="block text-sm font-bold text-gray-700"
                >
                  Nama Lengkap / Badan Hukum
                </label>
                <CharCounter current={siteForm.legalName?.length} max={160} />
              </div>
              <input
                id="site-legal-name"
                required
                maxLength={160}
                value={siteForm.legalName || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, legalName: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-tagline"
                  className="block text-sm font-bold text-gray-700"
                >
                  Tagline Header
                </label>
                <CharCounter current={siteForm.tagline?.length} max={160} />
              </div>
              <input
                id="site-tagline"
                required
                maxLength={160}
                value={siteForm.tagline || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, tagline: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-admin-label"
                  className="block text-sm font-bold text-gray-700"
                >
                  Label Tautan Portal Pengelola
                </label>
                <CharCounter
                  current={siteForm.adminPortalLabel?.length}
                  max={60}
                />
              </div>
              <input
                id="site-admin-label"
                required
                maxLength={60}
                value={siteForm.adminPortalLabel || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, adminPortalLabel: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 pt-3 border-t border-gray-100 md:grid-cols-2">
            <ImageField
              id="site-logo"
              label="Logo Utama"
              value={siteForm.logoUrl || ""}
              onChange={(url) => setSiteForm({ ...siteForm, logoUrl: url })}
              previewFallback="/podo-rukun.png"
            />
            <ImageField
              id="site-partner-logo"
              label="Logo Pendamping"
              value={siteForm.partnerLogoUrl || ""}
              onChange={(url) =>
                setSiteForm({ ...siteForm, partnerLogoUrl: url })
              }
            />
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-5">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-meta-title"
                  className="block text-sm font-bold text-gray-700"
                >
                  Judul Tab / Meta Title
                </label>
                <CharCounter current={siteForm.metaTitle?.length} max={200} />
              </div>
              <input
                id="site-meta-title"
                required
                maxLength={200}
                value={siteForm.metaTitle || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, metaTitle: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-meta-description"
                  className="block text-sm font-bold text-gray-700"
                >
                  Meta Deskripsi
                </label>
                <CharCounter
                  current={siteForm.metaDescription?.length}
                  max={400}
                />
              </div>
              <textarea
                id="site-meta-description"
                required
                rows={3}
                maxLength={400}
                value={siteForm.metaDescription || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, metaDescription: e.target.value })
                }
                className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-feed-title"
                  className="block text-sm font-bold text-gray-700"
                >
                  Judul Feed RSS
                </label>
                <CharCounter current={siteForm.feedTitle?.length} max={200} />
              </div>
              <input
                id="site-feed-title"
                required
                maxLength={200}
                value={siteForm.feedTitle || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, feedTitle: e.target.value })
                }
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="site-feed-description"
                  className="block text-sm font-bold text-gray-700"
                >
                  Deskripsi Feed RSS
                </label>
                <CharCounter
                  current={siteForm.feedDescription?.length}
                  max={400}
                />
              </div>
              <textarea
                id="site-feed-description"
                required
                rows={2}
                maxLength={400}
                value={siteForm.feedDescription || ""}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, feedDescription: e.target.value })
                }
                className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="site-copyright"
                    className="block text-sm font-bold text-gray-700"
                  >
                    Teks Hak Cipta
                  </label>
                  <CharCounter current={siteForm.copyright?.length} max={200} />
                </div>
                <input
                  id="site-copyright"
                  required
                  maxLength={200}
                  value={siteForm.copyright || ""}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, copyright: e.target.value })
                  }
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
                />
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="site-location-line"
                    className="block text-sm font-bold text-gray-700"
                  >
                    Baris Lokasi Sub-footer
                  </label>
                  <CharCounter
                    current={siteForm.locationLine?.length}
                    max={160}
                  />
                </div>
                <input
                  id="site-location-line"
                  required
                  maxLength={160}
                  value={siteForm.locationLine || ""}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, locationLine: e.target.value })
                  }
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Label Menu Navigasi
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {NAV_FIELDS.map((field) => (
                <div key={field.name}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`site-nav-${field.name}`}
                      className="block text-sm font-bold text-gray-700"
                    >
                      {field.label}
                    </label>
                    <CharCounter
                      current={siteForm.nav?.[field.name]?.length}
                      max={40}
                    />
                  </div>
                  <input
                    id={`site-nav-${field.name}`}
                    required
                    maxLength={40}
                    value={siteForm.nav?.[field.name] || ""}
                    onChange={(e) =>
                      setSiteForm({
                        ...siteForm,
                        nav: { ...siteForm.nav, [field.name]: e.target.value },
                      })
                    }
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {status.site.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.site.error}
            </p>
          )}
          {status.site.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.site.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.site.saving}
              onClick={() => handleReset("site")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.site.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.site.saving ? "Menyimpan..." : "Simpan Identitas"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* Teks Halaman */}
      {/* ========================================================================= */}
      <section
        hidden={activeTab !== "sections"}
        className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Teks Halaman</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Eyebrow, judul, deskripsi, dan teks saat daftar kosong untuk tiap
              section dan halaman publik.
            </p>
          </div>
          {updatedAt.sections && (
            <span className="text-xs text-gray-400">
              Diperbarui: {dateFormatter.format(new Date(updatedAt.sections))}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave("sections", sectionsForm);
          }}
          className="mt-6 space-y-8"
        >
          {SECTION_FIELDS.map((group) => (
            <fieldset
              key={group.key}
              className="rounded-2xl border border-gray-200 p-4 sm:p-5"
            >
              <legend className="px-2 text-sm font-bold text-gray-800">
                {group.title}
              </legend>
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                {group.fields.map((field) => {
                  const value = sectionsForm[group.key]?.[field.name] || "";
                  const inputId = `section-${group.key}-${field.name}`;
                  return (
                    <div
                      key={field.name}
                      className={field.textarea ? "md:col-span-2" : ""}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={inputId}
                          className="block text-sm font-bold text-gray-700"
                        >
                          {field.label}
                        </label>
                        <CharCounter current={value.length} max={field.max} />
                      </div>
                      {field.textarea ? (
                        <textarea
                          id={inputId}
                          required
                          rows={2}
                          maxLength={field.max}
                          value={value}
                          onChange={(e) =>
                            updateSectionField(
                              group.key,
                              field.name,
                              e.target.value,
                            )
                          }
                          className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                        />
                      ) : (
                        <input
                          id={inputId}
                          required
                          maxLength={field.max}
                          value={value}
                          onChange={(e) =>
                            updateSectionField(
                              group.key,
                              field.name,
                              e.target.value,
                            )
                          }
                          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:border-green-700"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {status.sections.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              {status.sections.error}
            </p>
          )}
          {status.sections.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800"
            >
              {status.sections.success}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={status.sections.saving}
              onClick={() => handleReset("sections")}
              className="min-h-[44px] w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.sections.saving}
              className="min-h-[44px] w-full cursor-pointer rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50 sm:w-auto"
            >
              {status.sections.saving ? "Menyimpan..." : "Simpan Judul"}
            </button>
          </div>
        </form>
      </section>

      {previewOpen && (
        <PreviewPanel
          activeKey={activeTab}
          activeLabel={activeTabConfig.label}
          forms={forms}
          dirtyKeys={dirtyTabs.map((tab) => tab.key)}
          onClose={() => setPreviewOpen(false)}
          triggerRef={previewTrigger}
        />
      )}
    </div>
  );
}
