import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi, toSlug } from "./api";

function AdminCategories() {
  const { user } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [editingId, setEditingId] = useState(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    // Layar penolakan itu di-render sebelum status loading dibaca, jadi tidak
    // perlu menyentuh state loading di sini.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/categories")
      .then(({ categories: rows }) => {
        if (active) {
          setCategories(rows);
          setLoading(false);
        }
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
  }, [refreshKey, user.role]);

  if (user.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Pengelolaan kategori hanya tersedia untuk admin.
      </p>
    );
  }

  const resetForm = () => {
    setForm({ name: "", slug: "" });
    setEditingId(null);
    setSlugEdited(false);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      await adminApi(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setForm({ name: category.name, slug: category.slug });
    setEditingId(category.id);
    setSlugEdited(true);
    setError("");
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Hapus kategori “${category.name}”?`)) return;
    setError("");
    try {
      await adminApi(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-7">
        <p className="font-bold text-green-700">Pengaturan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Kategori</h1>
        <p className="mt-2 text-gray-600">Atur kategori yang tersedia untuk artikel.</p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mb-7 grid grid-cols-1 gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 sm:p-7">
        <div>
          <label htmlFor="category-name" className="mb-2 block font-bold text-gray-700">
            Nama kategori
          </label>
          <input
            id="category-name"
            required
            maxLength={100}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
                ...(!slugEdited ? { slug: toSlug(event.target.value) } : {}),
              }))
            }
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label htmlFor="category-slug" className="mb-2 block font-bold text-gray-700">
            Slug
          </label>
          <input
            id="category-slug"
            required
            maxLength={120}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={form.slug}
            onChange={(event) => {
              setSlugEdited(true);
              setForm((current) => ({
                ...current,
                slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
              }));
            }}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Tambah kategori"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[44px] w-full rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200 sm:w-auto"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Memuat kategori...</p>
        ) : categories.length ? (
          <ul className="divide-y divide-gray-100">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-gray-900">{category.name}</p>
                  <p className="mt-1 break-all text-sm text-gray-500">/{category.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    className="min-h-[44px] rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-gray-500">Belum ada kategori.</p>
        )}
      </div>
    </section>
  );
}

export default AdminCategories;
