import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import { formatDate } from "../lib/date";

const emptyForm = { imageUrl: "", caption: "", eventDate: "" };

function AdminGallery() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ caption: "", eventDate: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInput = useRef(null);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/gallery")
      .then(({ items: rows }) => {
        if (active) {
          setItems(rows);
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
        Akses ditolak. Pengelolaan galeri hanya tersedia untuk admin.
      </p>
    );
  }

  const pickImage = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("image", file);
      const result = await adminApi("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      setForm((current) => ({ ...current, imageUrl: result.url }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.imageUrl) {
      setError("Pilih gambar terlebih dahulu sebelum menyimpan.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await adminApi("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          caption: form.caption,
          eventDate: form.eventDate || null,
        }),
      });
      setForm(emptyForm);
      setNotice("Foto berhasil ditambahkan.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      caption: item.caption || "",
      eventDate: item.eventDate || "",
    });
    setError("");
    setNotice("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    setSavingId(editingId);
    setError("");
    setNotice("");
    try {
      await adminApi(`/api/admin/gallery/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          caption: editForm.caption,
          eventDate: editForm.eventDate || null,
        }),
      });
      setEditingId(null);
      setNotice("Keterangan foto berhasil diperbarui.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm("Hapus foto ini dari galeri?")) return;

    setError("");
    setNotice("");
    try {
      await adminApi(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) setEditingId(null);
      setNotice("Foto berhasil dihapus.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7">
        <p className="font-bold text-green-700">Konten</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Galeri</h1>
        <p className="mt-2 text-gray-600">
          Unggah foto kegiatan dan atur keterangan yang tampil di halaman galeri.
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 p-4 text-green-800"
        >
          <p className="font-semibold">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="rounded-lg px-3 py-1 text-sm font-bold text-green-800 transition hover:bg-green-100"
          >
            Tutup
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mb-7 grid gap-5 rounded-3xl bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7"
      >
        <div className="sm:col-span-2">
          <span className="mb-2 block font-bold text-gray-700">Gambar</span>
          <div className="mb-3 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Pratinjau gambar galeri"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-green-700">
                <i className="fa-regular fa-image" aria-hidden="true"></i>
              </div>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pickImage}
            className="sr-only"
            aria-label="Unggah gambar galeri"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-green-50 px-4 py-3 font-bold text-green-800 hover:bg-green-100 disabled:opacity-60"
            >
              {uploading ? "Mengunggah..." : "Pilih gambar"}
            </button>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                className="rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50"
              >
                Hapus pilihan
              </button>
            )}
            <span className="text-sm text-gray-500">
              JPG, PNG, WebP. Maksimal 2 MB.
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="gallery-caption"
            className="mb-2 block font-bold text-gray-700"
          >
            Keterangan
          </label>
          <input
            id="gallery-caption"
            maxLength={200}
            value={form.caption}
            onChange={(event) =>
              setForm((current) => ({ ...current, caption: event.target.value }))
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        <div>
          <label
            htmlFor="gallery-event-date"
            className="mb-2 block font-bold text-gray-700"
          >
            Tanggal kegiatan (opsional)
          </label>
          <input
            id="gallery-event-date"
            type="date"
            value={form.eventDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventDate: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Tambah foto"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Memuat galeri...</p>
        ) : items.length ? (
          <ul className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {items.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.caption || "Foto galeri"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  {editingId === item.id ? (
                    <form onSubmit={saveEdit} className="space-y-3">
                      <div>
                        <label
                          htmlFor={`gallery-caption-${item.id}`}
                          className="mb-1 block text-sm font-bold text-gray-700"
                        >
                          Keterangan
                        </label>
                        <input
                          id={`gallery-caption-${item.id}`}
                          maxLength={200}
                          value={editForm.caption}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              caption: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-green-700"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`gallery-event-date-${item.id}`}
                          className="mb-1 block text-sm font-bold text-gray-700"
                        >
                          Tanggal kegiatan
                        </label>
                        <input
                          id={`gallery-event-date-${item.id}`}
                          type="date"
                          value={editForm.eventDate}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              eventDate: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-green-700"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={savingId === item.id}
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
                        >
                          {savingId === item.id ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900">
                        {item.caption || "Tanpa keterangan"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.eventDate
                          ? formatDate(item.eventDate)
                          : "Tanpa tanggal"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item)}
                          className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-gray-500">Belum ada foto galeri.</p>
        )}
      </div>
    </section>
  );
}

export default AdminGallery;
