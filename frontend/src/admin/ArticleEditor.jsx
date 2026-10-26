import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import ArticleImage from "../components/ArticleImage";
import ArticleView from "../components/ArticleView";
import EditorToolbar from "./EditorToolbar";
import { adminApi, dateFormatter, uniqueSlug } from "./api";
import StatusBadge from "./components/StatusBadge";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";
import { useUnsavedChangesGuard } from "./components/useUnsavedChangesGuard";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  categoryId: "",
  coverImageUrl: "",
  status: "draft",
  publishedAt: "",
};

// Sejalan dengan allowedSchemes di backend (services/articles.js): tautan relatif
// tetap boleh, tetapi javascript:/data: dan skema lain ditolak sebelum disimpan.
const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

function isAllowedLink(value) {
  try {
    return ALLOWED_LINK_PROTOCOLS.includes(
      new URL(value, window.location.origin).protocol,
    );
  } catch {
    return false;
  }
}

// Browser menormalkan warna hex menjadi rgb() saat atribut style diserialisasi,
// jadi warnanya dikembalikan ke hex sebelum dikirim. Sanitizer backend hanya
// menerima warna hex (#rgb / #rrggbb).
const RGB_COLOR =
  /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)/g;

const toHexColor = (_match, red, green, blue) =>
  `#${[red, green, blue]
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;

function normalizeColorStyles(html) {
  if (!html.includes("rgb")) return html;
  return html.replace(
    /style="([^"]*)"/g,
    (_match, css) => `style="${css.replace(RGB_COLOR, toHexColor)}"`,
  );
}

const padDatePart = (value) => String(value).padStart(2, "0");

// input datetime-local memakai waktu lokal tanpa zona waktu. Nilai ISO dari
// server (UTC) harus diubah ke komponen waktu lokal, bukan dipotong mentah.
function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function ArticleEditor() {
  const { user } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [existingArticles, setExistingArticles] = useState([]);
  const [slugEdited, setSlugEdited] = useState(Boolean(id));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const coverInput = useRef(null);
  const inlineInput = useRef(null);
  // Cuplikan isi form saat terakhir dimuat/disimpan, dipakai untuk mendeteksi
  // perubahan yang belum disimpan.
  const initialSnapshot = useRef(null);
  // Keadaan pratinjau sengaja dipisah dari form: membuka atau menutup pratinjau
  // tidak boleh mengubah isi editor maupun cuplikan perubahan yang belum
  // disimpan di atas.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewPublishedAt, setPreviewPublishedAt] = useState("");
  const [previewWidth, setPreviewWidth] = useState("desktop");
  const previewButton = useRef(null);
  const previewDialog = useRef(null);
  // Riwayat revisi hanya tersedia untuk artikel yang sudah tersimpan (ada id).
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState([]);
  const [restoringId, setRestoringId] = useState(null);
  const historyButton = useRef(null);
  const historyDialog = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    // Toolbar membaca isActive()/getAttributes() saat render, jadi komponen
    // perlu dirender ulang setiap transaksi (ketikan dan perubahan seleksi).
    shouldRerenderOnTransaction: true,
    extensions: [
      // StarterKit v3 sudah membawa underline, strike, horizontal rule, dan
      // undo/redo, jadi ekstensi itu tidak didaftarkan lagi di sini.
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "article-content min-h-72 rounded-b-2xl border border-t-0 border-gray-200 px-5 py-4 outline-none",
        "aria-label": "Isi artikel",
      },
    },
  });

  useEffect(() => {
    let active = true;
    const requests = [
      adminApi("/api/admin/articles").then(({ articles }) => articles),
      adminApi("/api/categories").then(({ categories: rows }) => rows),
    ];
    if (id) {
      requests.push(
        adminApi(`/api/admin/articles/${id}`).then(({ article }) => article),
      );
    }

    Promise.all(requests)
      .then(([articles, categoryRows, article]) => {
        if (!active) return;
        setExistingArticles(articles);
        setCategories(categoryRows);
        if (article) {
          const loadedForm = {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || "",
            categoryId: article.categoryId ? String(article.categoryId) : "",
            coverImageUrl: article.coverImageUrl || "",
            status: article.status,
            publishedAt: toDateTimeLocal(article.publishedAt),
          };
          setForm(loadedForm);
          setSlugEdited(true);
          if (editor) {
            editor.commands.setContent(article.contentHtml || "");
            initialSnapshot.current = JSON.stringify({
              form: loadedForm,
              html: editor.getHTML(),
            });
          }
        } else if (editor) {
          initialSnapshot.current = JSON.stringify({
            form: emptyForm,
            html: editor.getHTML(),
          });
        }
        setLoading(false);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [editor, id]);

  // Peringatan perubahan belum disimpan, baik saat berpindah halaman di dalam
  // panel maupun saat menutup/memuat ulang tab. Snapshot awal diambil setelah
  // artikel selesai dimuat supaya editor yang masih kosong tidak dianggap berubah.
  const hasUnsavedChanges =
    Boolean(editor && initialSnapshot.current) &&
    JSON.stringify({ form, html: editor.getHTML() }) !== initialSnapshot.current;
  useUnsavedChangesGuard(
    hasUnsavedChanges,
    "Ada perubahan artikel yang belum disimpan. Tinggalkan halaman ini?",
  );

  // Selama dialog terbuka: halaman tidak ikut ter-scroll, fokus pindah ke
  // dialog, Escape menutupnya, dan fokus kembali ke tombol Pratinjau.
  useEffect(() => {
    if (!previewOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    // Nilai ref disimpan sekarang; saat cleanup, ref bisa sudah menunjuk node lain.
    const trigger = previewButton.current;
    document.body.style.overflow = "hidden";
    previewDialog.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [previewOpen]);

  // Perilaku dialog riwayat sama dengan pratinjau: kunci scroll, fokus masuk ke
  // dialog, Escape menutup, dan fokus kembali ke tombol pembukanya.
  useEffect(() => {
    if (!historyOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const trigger = historyButton.current;
    document.body.style.overflow = "hidden";
    historyDialog.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [historyOpen]);

  const openHistory = async () => {
    if (!id) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistory([]);
    try {
      const { revisions } = await adminApi(`/api/admin/articles/${id}/revisions`);
      setHistory(Array.isArray(revisions) ? revisions : []);
    } catch (historyFailure) {
      setHistoryError(historyFailure.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const restoreRevision = async (revision) => {
    const confirmed = await confirm({
      title: "Pulihkan versi ini?",
      message:
        "Isi artikel saat ini akan disimpan sebagai revisi baru, lalu diganti dengan versi yang dipilih.",
      detail: `${revision.title} · ${dateFormatter.format(new Date(revision.createdAt))}`,
      confirmLabel: "Pulihkan versi",
      tone: "default",
    });
    if (!confirmed) return;
    setError("");
    setRestoringId(revision.id);
    try {
      await adminApi(`/api/admin/articles/${id}/revisions/${revision.id}/restore`, {
        method: "POST",
      });
      window.location.reload();
    } catch (restoreFailure) {
      setError(restoreFailure.message);
      toast.show(restoreFailure.message, "error");
      setRestoringId(null);
    }
  };

  const openPreview = async () => {
    if (!editor) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewHtml("");
    setPreviewPublishedAt(new Date().toISOString());
    try {
      // Browser menormalkan warna hex menjadi rgb() saat style diserialisasi,
      // sedangkan sanitizer hanya menerima hex. Normalisasi yang sama dengan
      // saat menyimpan dipakai di sini supaya pratinjau benar-benar sama dengan
      // halaman publik.
      const { contentHtml } = await adminApi("/api/admin/articles/preview", {
        method: "POST",
        body: JSON.stringify({
          contentHtml: normalizeColorStyles(editor.getHTML()),
        }),
      });
      setPreviewHtml(contentHtml || "");
    } catch (previewFailure) {
      setPreviewError(
        previewFailure.status
          ? previewFailure.message
          : "Pratinjau gagal dimuat. Periksa koneksi, lalu coba lagi.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateTitle = (title) => {
    setForm((current) => ({
      ...current,
      title,
      ...(!slugEdited
        ? {
            slug: uniqueSlug(title, existingArticles, id ? Number(id) : undefined),
          }
        : {}),
    }));
  };

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const result = await adminApi("/api/admin/upload", {
      method: "POST",
      body: data,
    });
    return result.url;
  };

  const uploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      setField("coverImageUrl", await uploadImage(file));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  };

  const uploadInlineImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    setInlineUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      // Nama berkas tidak berguna untuk pembaca layar, jadi teks alternatif
      // diminta langsung ke penulis (boleh dikosongkan untuk gambar hiasan).
      const alt = window.prompt(
        "Teks alternatif gambar (deskripsi singkat untuk pembaca layar)",
        "",
      );
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: (alt ?? "").trim() })
        .run();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setInlineUploading(false);
      event.target.value = "";
    }
  };

  const insertLink = () => {
    const current = editor?.getAttributes("link").href || "";
    const href = window.prompt("Masukkan alamat tautan", current);
    if (href === null || !editor) return;
    const value = href.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isAllowedLink(value)) {
      setError(
        "Tautan hanya boleh diawali http://, https://, mailto:, atau tel:.",
      );
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!editor) return;
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      contentHtml: normalizeColorStyles(editor.getHTML()),
      coverImageUrl: form.coverImageUrl || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    if (user.role === "admin") {
      payload.status = form.status;
      if (form.status === "published" && form.publishedAt) {
        payload.publishedAt = new Date(form.publishedAt).toISOString();
      }
    }

    try {
      if (id) {
        await adminApi(`/api/admin/articles/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
      } else {
        await adminApi("/api/admin/articles", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      }
      navigate("/admin/articles", {
        replace: true,
        state: { notice: id ? "Artikel berhasil diperbarui." : "Artikel berhasil dibuat." },
      });
    } catch (saveError) {
      if (saveError.status === 409) {
        setError(
          "Alamat artikel ini sudah dipakai artikel lain. Ubah alamatnya lalu simpan lagi.",
        );
        setSlugEdited(true);
      } else {
        setError(saveError.message);
      }
      toast.show(saveError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-gray-500">Memuat formulir...</p>;
  }

  const previewCategory = categories.find(
    (category) => String(category.id) === form.categoryId,
  );
  const previewArticle = {
    title: form.title,
    excerpt: form.excerpt,
    categoryName: previewCategory?.name || "",
    authorName: user.name,
    publishedAt: previewPublishedAt,
    coverImageUrl: form.coverImageUrl || null,
    contentHtml: previewHtml,
  };

  return (
    <section className="mx-auto max-w-4xl">
      <header className="mb-7">
        <RouterLink
          to="/admin/articles"
          className="font-bold text-green-700 hover:text-green-900"
        >
          <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true"></i>
          Kembali ke artikel
        </RouterLink>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {id ? "Ubah artikel" : "Tulis artikel"}
          </h1>
          <StatusBadge status={form.status} />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          {user.role === "admin"
            ? "Simpan sebagai draf untuk ditinjau, atau terbitkan langsung ke halaman blog."
            : "Penerbitan dilakukan oleh admin. Simpan pekerjaan Anda sebagai draf."}
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="space-y-6">
        <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div>
            <label htmlFor="article-title" className="mb-2 block font-bold text-gray-700">
              Judul
            </label>
            <input
              id="article-title"
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label htmlFor="article-slug" className="mb-2 block font-bold text-gray-700">
              Alamat artikel
            </label>
            <input
              id="article-slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              maxLength={220}
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                setField("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
            <p className="mt-2 text-xs text-gray-500">
              Bagian akhir alamat halaman artikel (mis. “berita-desa”), dibuat otomatis dari
              judul. Gunakan huruf kecil, angka, dan tanda hubung.
            </p>
          </div>

          <div>
            <label htmlFor="article-excerpt" className="mb-2 block font-bold text-gray-700">
              Ringkasan
            </label>
            <textarea
              id="article-excerpt"
              rows={3}
              maxLength={1000}
              value={form.excerpt}
              onChange={(event) => setField("excerpt", event.target.value)}
              className="min-h-[44px] w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="article-category" className="mb-2 block font-bold text-gray-700">
                Kategori
              </label>
              <select
                id="article-category"
                value={form.categoryId}
                onChange={(event) => setField("categoryId", event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-green-700"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {user.role === "admin" ? (
              <div>
                <label htmlFor="article-status" className="mb-2 block font-bold text-gray-700">
                  Status
                </label>
                <select
                  id="article-status"
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-green-700"
                >
                  <option value="draft">Draf</option>
                  <option value="published">Terbit</option>
                </select>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-800">Status artikel</p>
                <div className="mt-2">
                  <StatusBadge status={form.status} />
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  {form.status === "published"
                    ? "Artikel ini sudah terbit. Simpan perubahan Anda; penerbitan ulang diatur admin."
                    : "Penerbitan dilakukan oleh admin. Setelah disimpan, artikel berstatus draf."}
                </p>
              </div>
            )}
          </div>
          {user.role === "admin" && form.status === "published" && (
            <div>
              <label htmlFor="article-published-at" className="mb-2 block font-bold text-gray-700">
                Tanggal terbit (opsional)
              </label>
              <input
                id="article-published-at"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => setField("publishedAt", event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
              />
              <p className="mt-2 text-xs text-gray-500">
                Kosongkan untuk memakai waktu sekarang saat artikel diterbitkan.
              </p>
            </div>
          )}

          <div>
            <span className="mb-2 block font-bold text-gray-700">Gambar sampul</span>
            <div className="mb-3 w-full overflow-hidden rounded-2xl border border-gray-200">
              <ArticleImage
                src={form.coverImageUrl || null}
                alt="Pratinjau gambar sampul"
                containerClassName="w-full aspect-[16/9]"
                iconSize="text-5xl"
              />
            </div>
            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadCover}
              className="sr-only"
              aria-label="Unggah gambar sampul"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => coverInput.current?.click()}
                disabled={coverUploading}
                className="min-h-[44px] w-full rounded-xl bg-green-50 px-4 py-3 font-bold text-green-800 hover:bg-green-100 disabled:opacity-60 sm:w-auto"
              >
                {coverUploading ? "Mengunggah..." : "Pilih gambar"}
              </button>
              {form.coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setField("coverImageUrl", "")}
                  className="min-h-[44px] w-full rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50 sm:w-auto"
                >
                  Hapus sampul
                </button>
              )}
              <span className="self-center text-sm text-gray-500">
                JPG, PNG, WebP. Maksimal 2 MB.
              </span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <EditorToolbar
            editor={editor}
            onInsertLink={insertLink}
            onPickImage={() => inlineInput.current?.click()}
            imageUploading={inlineUploading}
          />
          <input
            ref={inlineInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadInlineImage}
            className="sr-only"
            aria-label="Unggah gambar ke isi artikel"
          />
          <EditorContent editor={editor} />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          {id && (
            <button
              ref={historyButton}
              type="button"
              onClick={openHistory}
              aria-haspopup="dialog"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-100 motion-reduce:transition-none sm:w-auto"
            >
              <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
              Riwayat revisi
            </button>
          )}
          <button
            ref={previewButton}
            type="button"
            onClick={openPreview}
            disabled={!editor}
            aria-haspopup="dialog"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
          >
            <i className="fa-regular fa-eye" aria-hidden="true"></i>
            Pratinjau
          </button>
          <RouterLink
            to="/admin/articles"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-gray-700 shadow-sm hover:bg-gray-100 sm:w-auto"
          >
            Batal
          </RouterLink>
          <button
            type="submit"
            disabled={saving || coverUploading || inlineUploading || !editor}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
          >
            {saving
              ? "Menyimpan..."
              : user.role === "admin" && form.status === "published"
                ? "Simpan dan terbitkan"
                : "Simpan draf"}
          </button>
        </div>
      </form>

      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-gray-900/60 p-4 sm:p-6">
          <div
            ref={previewDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-preview-title"
            tabIndex={-1}
            className="mx-auto max-h-[90dvh] w-full max-w-5xl overflow-y-auto overflow-x-hidden overscroll-contain rounded-3xl bg-white shadow-2xl outline-none"
          >
            <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 bg-white p-4 sm:p-5">
              <div className="min-w-0">
                <h2
                  id="article-preview-title"
                  className="text-lg font-extrabold text-gray-900"
                >
                  Pratinjau artikel
                </h2>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
                  Pratinjau, belum disimpan
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Lebar pratinjau"
                  className="flex rounded-xl bg-gray-100 p-1"
                >
                  <button
                    type="button"
                    aria-pressed={previewWidth === "desktop"}
                    onClick={() => setPreviewWidth("desktop")}
                    className={`min-h-[44px] rounded-lg px-4 text-sm font-bold transition ${
                      previewWidth === "desktop"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewWidth === "ponsel"}
                    onClick={() => setPreviewWidth("ponsel")}
                    className={`min-h-[44px] rounded-lg px-4 text-sm font-bold transition ${
                      previewWidth === "ponsel"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Ponsel
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="min-h-[44px] rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800"
                >
                  Tutup pratinjau
                </button>
              </div>
            </div>

            <div className="bg-gray-100 p-4 sm:p-8">
              <div
                className={`mx-auto w-full rounded-2xl bg-white p-4 shadow-sm sm:p-6 ${
                  previewWidth === "desktop" ? "max-w-[720px]" : "max-w-[390px]"
                }`}
              >
                {previewLoading ? (
                  <p className="py-16 text-center text-sm font-medium text-gray-500">
                    Memuat pratinjau...
                  </p>
                ) : previewError ? (
                  <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {previewError}
                  </p>
                ) : (
                  <ArticleView article={previewArticle} showPlaceholders />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-gray-900/60 p-4 sm:p-6">
          <div
            ref={historyDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-history-title"
            tabIndex={-1}
            className="mx-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-2xl outline-none"
          >
            <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 bg-white p-4 sm:p-5">
              <div>
                <h2
                  id="article-history-title"
                  className="text-lg font-extrabold text-gray-900"
                >
                  Riwayat revisi
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Versi tersimpan sebelumnya, terbaru lebih dulu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="min-h-[44px] rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800"
              >
                Tutup
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {historyLoading ? (
                <p className="py-10 text-center text-sm font-medium text-gray-500">
                  Memuat riwayat...
                </p>
              ) : historyError ? (
                <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {historyError}
                </p>
              ) : history.length ? (
                <ul className="divide-y divide-gray-100">
                  {history.map((revision) => (
                    <li
                      key={revision.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">
                          {revision.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {dateFormatter.format(new Date(revision.createdAt))}
                          {revision.savedByName
                            ? ` · oleh ${revision.savedByName}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreRevision(revision)}
                        disabled={restoringId !== null}
                        className="min-h-[44px] rounded-lg bg-green-50 px-4 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                      >
                        {restoringId === revision.id ? "Memulihkan..." : "Pulihkan"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-center text-sm text-gray-500">
                  Belum ada revisi. Revisi dibuat saat isi artikel diubah.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ArticleEditor;
