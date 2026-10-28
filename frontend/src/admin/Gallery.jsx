import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import { formatDate } from "../lib/date";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

const emptyForm = { imageUrl: "", caption: "", eventDate: "" };

function AdminGallery() {
  const { user } = useOutletContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      data.append("category", "gallery");
      const result = await adminApi("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      setForm((current) => ({ ...current, imageUrl: result.url }));
    } catch (uploadError) {
      toast.show(uploadError.message, "error");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.imageUrl) {
      toast.show("Pilih gambar terlebih dahulu sebelum menyimpan.", "error");
      return;
    }

    setSaving(true);
    setError("");
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
      toast.show("Foto berhasil ditambahkan.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
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
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    setSavingId(editingId);
    setError("");
    try {
      await adminApi(`/api/admin/gallery/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          caption: editForm.caption,
          eventDate: editForm.eventDate || null,
        }),
      });
      setEditingId(null);
      toast.show("Keterangan foto berhasil diperbarui.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    } finally {
      setSavingId(null);
    }
  };

  const deleteItem = async (item) => {
    const confirmed = await confirm({
      title: "Hapus foto ini?",
      message:
        "Foto akan hilang dari galeri publik dan dari bagian Kegiatan di beranda.",
      detail: item.caption || "Foto tanpa keterangan",
      confirmLabel: "Hapus foto",
    });
    if (!confirmed) return;

    setError("");
    try {
      await adminApi(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) setEditingId(null);
      toast.show("Foto berhasil dihapus.");
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Konten"
        title="Galeri"
        description="Unggah foto kegiatan dan atur keterangan yang tampil di halaman galeri serta bagian Kegiatan di beranda."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mb-7 grid grid-cols-1 gap-5 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 sm:p-7"
      >
        <div className="md:col-span-2">
          <span className="mb-2 block font-bold text-gray-700">Gambar</span>
          <div className="mb-3 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Pratinjau gambar galeri"
                className="h-full w-full object-cover"
                decoding="async"
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
              className="min-h-[44px] w-full rounded-xl bg-green-50 px-4 py-3 font-bold text-green-800 hover:bg-green-100 disabled:opacity-60 sm:w-auto"
            >
              {uploading ? "Mengunggah..." : "Pilih gambar"}
            </button>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50 sm:w-auto"
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
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
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
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Menyimpan..." : "Tambah foto"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={3} label="Memuat galeri..." />
        ) : items.length ? (
          <ul className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-6 sm:p-6">
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
                    decoding="async"
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
                          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3 py-2 text-base outline-none focus:border-green-700"
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
                          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3 py-2 text-base outline-none focus:border-green-700"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={savingId === item.id}
                          className="min-h-[44px] w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
                        >
                          {savingId === item.id ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-h-[44px] w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 sm:w-auto"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="break-words font-bold text-gray-900">
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
                          className="min-h-[44px] w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 sm:w-auto"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item)}
                          className="min-h-[44px] w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto"
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
          <EmptyState
            icon="images"
            title="Belum ada foto"
            description="Unggah foto pertama lewat formulir di atas. Foto ini juga tampil di bagian Kegiatan beranda bila belum ada artikel."
          />
        )}
      </div>
    </section>
  );
}

export default AdminGallery;
