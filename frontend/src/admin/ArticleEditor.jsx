import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import ArticleImage from "../components/ArticleImage";
import { adminApi, uniqueSlug } from "./api";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  categoryId: "",
  coverImageUrl: "",
  status: "draft",
};

function ArticleEditor() {
  const { user } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
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
          setForm({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || "",
            categoryId: article.categoryId ? String(article.categoryId) : "",
            coverImageUrl: article.coverImageUrl || "",
            status: article.status,
          });
          setSlugEdited(true);
          if (editor) editor.commands.setContent(article.contentHtml || "");
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
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
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
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
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
      contentHtml: editor.getHTML(),
      coverImageUrl: form.coverImageUrl || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    if (user.role === "admin") payload.status = form.status;

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
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const toolbarButton = (label, active, action, icon) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={action}
      className={`min-h-[44px] min-w-[44px] rounded-lg px-3 font-bold flex items-center justify-center transition ${
        active ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <i className={`fa-solid fa-${icon}`} aria-hidden="true"></i>
    </button>
  );

  if (loading) {
    return <p className="py-12 text-center text-gray-500">Memuat formulir...</p>;
  }

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
        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
          {id ? "Ubah artikel" : "Tulis artikel"}
        </h1>
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label htmlFor="article-slug" className="mb-2 block font-bold text-gray-700">
              Slug
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
            />
            <p className="mt-2 text-xs text-gray-500">
              Gunakan huruf kecil, angka, dan tanda hubung. Slug dibuat otomatis dari judul.
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
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="article-category" className="mb-2 block font-bold text-gray-700">
                Kategori
              </label>
              <select
                id="article-category"
                value={form.categoryId}
                onChange={(event) => setField("categoryId", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-700"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {user.role === "admin" && (
              <div>
                <label htmlFor="article-status" className="mb-2 block font-bold text-gray-700">
                  Status
                </label>
                <select
                  id="article-status"
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-700"
                >
                  <option value="draft">Draf</option>
                  <option value="published">Terbit</option>
                </select>
              </div>
            )}
          </div>

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
                className="rounded-xl bg-green-50 px-4 py-3 font-bold text-green-800 hover:bg-green-100 disabled:opacity-60"
              >
                {coverUploading ? "Mengunggah..." : "Pilih gambar"}
              </button>
              {form.coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setField("coverImageUrl", "")}
                  className="rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50"
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
          <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-3">
            {editor &&
              toolbarButton(
                "Tebal",
                editor.isActive("bold"),
                () => editor.chain().focus().toggleBold().run(),
                "bold",
              )}
            {editor &&
              toolbarButton(
                "Miring",
                editor.isActive("italic"),
                () => editor.chain().focus().toggleItalic().run(),
                "italic",
              )}
            {editor &&
              toolbarButton(
                "Judul",
                editor.isActive("heading", { level: 2 }),
                () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                "heading",
              )}
            {editor &&
              toolbarButton(
                "Daftar poin",
                editor.isActive("bulletList"),
                () => editor.chain().focus().toggleBulletList().run(),
                "list-ul",
              )}
            {editor &&
              toolbarButton(
                "Daftar nomor",
                editor.isActive("orderedList"),
                () => editor.chain().focus().toggleOrderedList().run(),
                "list-ol",
              )}
            {editor &&
              toolbarButton(
                "Kutipan",
                editor.isActive("blockquote"),
                () => editor.chain().focus().toggleBlockquote().run(),
                "quote-left",
              )}
            <button
              type="button"
              onClick={insertLink}
              className="min-h-[44px] rounded-lg px-3 font-bold text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <i className="fa-solid fa-link mr-2" aria-hidden="true"></i>
              Tautan
            </button>
            <input
              ref={inlineInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadInlineImage}
              className="sr-only"
              aria-label="Unggah gambar ke isi artikel"
            />
            <button
              type="button"
              onClick={() => inlineInput.current?.click()}
              disabled={inlineUploading}
              className="min-h-[44px] rounded-lg px-3 font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60 flex items-center"
            >
              <i className="fa-regular fa-image mr-2" aria-hidden="true"></i>
              {inlineUploading ? "Mengunggah..." : "Gambar"}
            </button>
          </div>
          <EditorContent editor={editor} />
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <RouterLink
            to="/admin/articles"
            className="min-h-[44px] flex items-center rounded-xl bg-white px-5 py-3 font-bold text-gray-700 shadow-sm hover:bg-gray-100"
          >
            Batal
          </RouterLink>
          <button
            type="submit"
            disabled={saving || coverUploading || inlineUploading || !editor}
            className="min-h-[44px] flex items-center rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-60 cursor-pointer"
          >
            {saving
              ? "Menyimpan..."
              : user.role === "admin" && form.status === "published"
                ? "Simpan dan terbitkan"
                : "Simpan draf"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ArticleEditor;
