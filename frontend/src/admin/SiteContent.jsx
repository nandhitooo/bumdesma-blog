import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";
import { DEFAULT_SITE_CONTENT } from "../lib/defaultContent";
import { useSiteContent } from "../lib/siteContent";
import { isValidIcon } from "../lib/siteContentUtils";

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

export default function SiteContent() {
  const { user } = useOutletContext();
  const { refreshContent } = useSiteContent();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState({});

  // Individual section states
  const [heroForm, setHeroForm] = useState(DEFAULT_SITE_CONTENT.hero);
  const [aboutForm, setAboutForm] = useState(DEFAULT_SITE_CONTENT.about);
  const [servicesForm, setServicesForm] = useState(DEFAULT_SITE_CONTENT.services);
  const [contactForm, setContactForm] = useState(DEFAULT_SITE_CONTENT.contact);
  const [footerForm, setFooterForm] = useState(DEFAULT_SITE_CONTENT.footer);

  // Status per section: { saving: bool, error: string, success: string }
  const [status, setStatus] = useState({
    hero: { saving: false, error: "", success: "" },
    about: { saving: false, error: "", success: "" },
    services: { saving: false, error: "", success: "" },
    contact: { saving: false, error: "", success: "" },
    footer: { saving: false, error: "", success: "" },
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
        if (data?.content) {
          if (data.content.hero) setHeroForm(data.content.hero);
          if (data.content.about) setAboutForm(data.content.about);
          if (data.content.services) setServicesForm(data.content.services);
          if (data.content.contact) setContactForm(data.content.contact);
          if (data.content.footer) setFooterForm(data.content.footer);
        }
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
      services: "Layanan",
      contact: "Kontak",
      footer: "Footer",
    };
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengembalikan bagian "${sectionNames[key]}" ke bawaan?`
    );
    if (!confirmed) return;

    setSectionStatus(key, { saving: true, error: "", success: "" });
    try {
      await adminApi(`/api/admin/site-content/${key}`, { method: "DELETE" });
      const defaultData = DEFAULT_SITE_CONTENT[key];
      if (key === "hero") setHeroForm(defaultData);
      if (key === "about") setAboutForm(defaultData);
      if (key === "services") setServicesForm(defaultData);
      if (key === "contact") setContactForm(defaultData);
      if (key === "footer") setFooterForm(defaultData);

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

  if (loading) {
    return (
      <div className="py-12 text-center text-sm font-medium text-gray-500">
        Memuat data konten situs...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Konten Situs
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola teks, informasi kontak, layanan, dan tautan di halaman utama website.
          </p>
        </div>
        <div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <span>Lihat situs</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden="true"></i>
          </Link>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION CARD */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">1. Bagian Hero (Beranda Utama)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Judul utama, deskripsi pengantar, tombol aksi, dan poin sorotan BUMDESMA.
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
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="hero-subtitle" className="block text-sm font-bold text-gray-700">
                Sub-judul (Kop Kecil)
              </label>
              <CharCounter current={heroForm.subtitle?.length} max={200} />
            </div>
            <input
              id="hero-subtitle"
              required
              maxLength={200}
              value={heroForm.subtitle || ""}
              onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="hero-title" className="block text-sm font-bold text-gray-700">
                Judul Utama
              </label>
              <CharCounter current={heroForm.title?.length} max={200} />
            </div>
            <input
              id="hero-title"
              required
              maxLength={200}
              value={heroForm.title || ""}
              onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="hero-desc" className="block text-sm font-bold text-gray-700">
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
              onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700 resize-y"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="hero-btn" className="block text-sm font-bold text-gray-700">
                Teks Tombol Aksi
              </label>
              <CharCounter current={heroForm.buttonLabel?.length} max={100} />
            </div>
            <input
              id="hero-btn"
              required
              maxLength={100}
              value={heroForm.buttonLabel || ""}
              onChange={(e) => setHeroForm({ ...heroForm, buttonLabel: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          {/* Repeatable Highlights */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Sorotan Hero (Highlights: {heroForm.highlights?.length || 0} / 6)
                </h3>
                <p className="text-xs text-gray-500">Minimal 1, maksimal 6 sorotan.</p>
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
                        { icon: "star", title: "Sorotan Baru", desc: "Deskripsi sorotan baru." },
                      ],
                    });
                  }
                }}
                className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-100 disabled:opacity-50 cursor-pointer"
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
                    <span className="text-xs font-bold text-gray-600">Sorotan #{index + 1}</span>
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
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
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
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Hapus sorotan"
                        disabled={heroForm.highlights.length <= 1}
                        onClick={() => {
                          const copy = heroForm.highlights.filter((_, i) => i !== index);
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label
                        htmlFor={`hero-highlight-${index}-icon`}
                        className="block text-xs font-semibold text-gray-600 mb-1"
                      >
                        Nama Ikon (FontAwesome tanpa fa-)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-brand-primary shrink-0">
                          {isValidIcon(hl.icon) ? (
                            <i className={`fa-solid fa-${hl.icon}`} aria-hidden="true"></i>
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
                            copy[index] = { ...copy[index], icon: e.target.value.toLowerCase().trim() };
                            setHeroForm({ ...heroForm, highlights: copy });
                          }}
                          placeholder="mis. calendar-check"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-8">
                      <div className="flex justify-between items-center mb-1">
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
                          copy[index] = { ...copy[index], title: e.target.value };
                          setHeroForm({ ...heroForm, highlights: copy });
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
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
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert / Status */}
          {status.hero.error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
              {status.hero.error}
            </p>
          )}
          {status.hero.success && (
            <p role="status" className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800">
              {status.hero.success}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={status.hero.saving}
              onClick={() => handleReset("hero")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.hero.saving}
              className="rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 cursor-pointer"
            >
              {status.hero.saving ? "Menyimpan..." : "Simpan Hero"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT SECTION CARD */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">2. Bagian Tentang (About)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Judul bagian, teks lokasi, paragraf profil, dan tautan dokumen profil resmi.
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
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="about-heading" className="block text-sm font-bold text-gray-700">
                Judul Utama Bagian
              </label>
              <CharCounter current={aboutForm.heading?.length} max={200} />
            </div>
            <input
              id="about-heading"
              required
              maxLength={200}
              value={aboutForm.heading || ""}
              onChange={(e) => setAboutForm({ ...aboutForm, heading: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="about-location" className="block text-sm font-bold text-gray-700">
                Lokasi / Sub-judul
              </label>
              <CharCounter current={aboutForm.location?.length} max={300} />
            </div>
            <input
              id="about-location"
              required
              maxLength={300}
              value={aboutForm.location || ""}
              onChange={(e) => setAboutForm({ ...aboutForm, location: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          {/* Repeatable Paragraphs */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-bold text-gray-700">
                  Paragraf Tentang ({aboutForm.paragraphs?.length || 0} / 6)
                </label>
                <p className="text-xs text-gray-500">Minimal 1, maksimal 6 paragraf.</p>
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
                className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-100 disabled:opacity-50 cursor-pointer"
              >
                + Tambah Paragraf
              </button>
            </div>

            <div className="space-y-3">
              {aboutForm.paragraphs?.map((para, index) => (
                <div key={index} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50">
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
                        className="p-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer ml-2"
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
                        className="p-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        title="Hapus paragraf"
                        disabled={aboutForm.paragraphs.length <= 1}
                        onClick={() => {
                          const copy = aboutForm.paragraphs.filter((_, i) => i !== index);
                          setAboutForm({ ...aboutForm, paragraphs: copy });
                        }}
                        className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700 resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="about-profile-url" className="block text-sm font-bold text-gray-700">
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
              onChange={(e) => setAboutForm({ ...aboutForm, profileUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          {/* Alert / Status */}
          {status.about.error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
              {status.about.error}
            </p>
          )}
          {status.about.success && (
            <p role="status" className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800">
              {status.about.success}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={status.about.saving}
              onClick={() => handleReset("about")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.about.saving}
              className="rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 cursor-pointer"
            >
              {status.about.saving ? "Menyimpan..." : "Simpan Tentang"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICES SECTION CARD */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">3. Bagian Layanan (Services)</h2>
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-bold text-gray-800">
                Daftar Layanan ({servicesForm.items?.length || 0} / 12)
              </span>
              <p className="text-xs text-gray-500">Minimal 1, maksimal 12 layanan usaha.</p>
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
                      { icon: "gear", title: "Layanan Baru", desc: "Deskripsi layanan baru." },
                    ],
                  });
                }
              }}
              className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-100 disabled:opacity-50 cursor-pointer"
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
                  <span className="text-xs font-bold text-gray-600">Layanan #{index + 1}</span>
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
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
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
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-down text-xs"></i>
                    </button>
                    <button
                      type="button"
                      title="Hapus layanan"
                      disabled={servicesForm.items.length <= 1}
                      onClick={() => {
                        const copy = servicesForm.items.filter((_, i) => i !== index);
                        setServicesForm({ ...servicesForm, items: copy });
                      }}
                      className="p-1.5 rounded hover:bg-red-100 text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor={`service-${index}-icon`}
                      className="block text-xs font-semibold text-gray-600 mb-1"
                    >
                      Nama Ikon (tanpa fa-)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-brand-primary shrink-0">
                        {isValidIcon(srv.icon) ? (
                          <i className={`fa-solid fa-${srv.icon}`} aria-hidden="true"></i>
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
                          copy[index] = { ...copy[index], icon: e.target.value.toLowerCase().trim() };
                          setServicesForm({ ...servicesForm, items: copy });
                        }}
                        placeholder="mis. coins"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-8">
                    <div className="flex justify-between items-center mb-1">
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
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-700 resize-y"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Alert / Status */}
          {status.services.error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
              {status.services.error}
            </p>
          )}
          {status.services.success && (
            <p role="status" className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800">
              {status.services.success}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={status.services.saving}
              onClick={() => handleReset("services")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.services.saving}
              className="rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 cursor-pointer"
            >
              {status.services.saving ? "Menyimpan..." : "Simpan Layanan"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 4. CONTACT SECTION CARD */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">4. Bagian Kontak & Lokasi</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Alamat operasional kantor, surel, kontak WhatsApp, dan peta Google Maps.
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
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contact-address" className="block text-sm font-bold text-gray-700">
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
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700">
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
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="contact-whatsapp-display" className="block text-sm font-bold text-gray-700">
                  Tampilan Nomor WhatsApp
                </label>
                <CharCounter current={contactForm.whatsappDisplay?.length} max={40} />
              </div>
              <input
                id="contact-whatsapp-display"
                required
                maxLength={40}
                value={contactForm.whatsappDisplay || ""}
                onChange={(e) => setContactForm({ ...contactForm, whatsappDisplay: e.target.value })}
                placeholder="+62 851-5616-2917"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contact-whatsapp" className="block text-sm font-bold text-gray-700">
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
                setContactForm({ ...contactForm, whatsapp: e.target.value.replace(/\D/g, "") })
              }
              placeholder="6285156162917"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contact-maps-link" className="block text-sm font-bold text-gray-700">
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
              onChange={(e) => setContactForm({ ...contactForm, mapsLink: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contact-maps-embed" className="block text-sm font-bold text-gray-700">
                URL Embed Google Maps (Harus diawali https://www.google.com/maps/embed)
              </label>
              <CharCounter current={contactForm.mapsEmbedUrl?.length} max={2048} />
            </div>
            <input
              id="contact-maps-embed"
              type="url"
              required
              maxLength={2048}
              value={contactForm.mapsEmbedUrl || ""}
              onChange={(e) => setContactForm({ ...contactForm, mapsEmbedUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          {/* Alert / Status */}
          {status.contact.error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
              {status.contact.error}
            </p>
          )}
          {status.contact.success && (
            <p role="status" className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800">
              {status.contact.success}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={status.contact.saving}
              onClick={() => handleReset("contact")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.contact.saving}
              className="rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 cursor-pointer"
            >
              {status.contact.saving ? "Menyimpan..." : "Simpan Kontak"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER SECTION CARD */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">5. Bagian Footer</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Deskripsi penutup, kontak ringkas kantor, dan tautan jejaring media sosial.
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
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="footer-desc" className="block text-sm font-bold text-gray-700">
                Deskripsi Singkat Footer
              </label>
              <CharCounter current={footerForm.description?.length} max={1000} />
            </div>
            <textarea
              id="footer-desc"
              required
              rows={3}
              maxLength={1000}
              value={footerForm.description || ""}
              onChange={(e) => setFooterForm({ ...footerForm, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700 resize-y"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="footer-address" className="block text-sm font-bold text-gray-700">
                Alamat Ringkas
              </label>
              <CharCounter current={footerForm.address?.length} max={500} />
            </div>
            <input
              id="footer-address"
              required
              maxLength={500}
              value={footerForm.address || ""}
              onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="footer-phone" className="block text-sm font-bold text-gray-700">
                  Nomor Telepon
                </label>
                <CharCounter current={footerForm.phone?.length} max={40} />
              </div>
              <input
                id="footer-phone"
                required
                maxLength={40}
                value={footerForm.phone || ""}
                onChange={(e) => setFooterForm({ ...footerForm, phone: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="footer-email" className="block text-sm font-bold text-gray-700">
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
                onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-700"
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
                <label htmlFor="footer-fb" className="block text-xs font-semibold text-gray-600 mb-1">
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
                      social: { ...footerForm.social, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label htmlFor="footer-ig" className="block text-xs font-semibold text-gray-600 mb-1">
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
                      social: { ...footerForm.social, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label htmlFor="footer-yt" className="block text-xs font-semibold text-gray-600 mb-1">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs outline-none focus:border-green-700"
                />
              </div>
            </div>
          </div>

          {/* Alert / Status */}
          {status.footer.error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
              {status.footer.error}
            </p>
          )}
          {status.footer.success && (
            <p role="status" className="rounded-xl bg-green-50 p-4 text-xs font-medium text-green-800">
              {status.footer.success}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={status.footer.saving}
              onClick={() => handleReset("footer")}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Kembalikan ke bawaan
            </button>
            <button
              type="submit"
              disabled={status.footer.saving}
              className="rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 cursor-pointer"
            >
              {status.footer.saving ? "Menyimpan..." : "Simpan Footer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
