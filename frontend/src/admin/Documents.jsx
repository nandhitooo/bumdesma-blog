import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

const EMPTY_FORM = {
  title: "",
  year: String(new Date().getFullYear()),
  description: "",
  url: "",
};

function AdminDocuments() {
  const { user } = useOutletContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/documents")
      .then(({ documents: rows }) => {
        if (active) {
          setDocuments(rows);
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
        Akses ditolak. Pengelolaan dokumen hanya tersedia untuk admin.
      </p>
    );
  }

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = editingId
        ? `/api/admin/documents/${editingId}`
        : "/api/admin/documents";
      await adminApi(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      toast.show(editingId ? "Dokumen diperbarui." : "Dokumen ditambahkan.");
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (document) => {
    setForm({
      title: document.title,
      year: String(document.year),
      description: document.description,
      url: document.url,
    });
    setEditingId(document.id);
    setError("");
  };

  const deleteDocument = async (document) => {
    const confirmed = await confirm({
      title: "Hapus dokumen ini?",
      message:
        "Tautan dokumen akan hilang dari halaman Transparansi. Berkas di Google Drive tidak terhapus.",
      detail: document.title,
      confirmLabel: "Hapus dokumen",
    });
    if (!confirmed) return;

    setError("");
    try {
      await adminApi(`/api/admin/documents/${document.id}`, {
        method: "DELETE",
      });
      toast.show("Dokumen berhasil dihapus.");
      if (editingId === document.id) resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Konten"
        title="Dokumen Laporan"
        description="Kelola tautan dokumen yang tampil di halaman Transparansi. Berkas tidak diunggah ke server; tempelkan tautan HTTPS (mis. Google Drive)."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mb-7 grid grid-cols-1 gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 sm:p-7"
      >
        <div className="md:col-span-2">
          <label
            htmlFor="document-title"
            className="mb-2 block font-bold text-gray-700"
          >
            Judul dokumen
          </label>
          <input
            id="document-title"
            required
            maxLength={200}
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label
            htmlFor="document-year"
            className="mb-2 block font-bold text-gray-700"
          >
            Tahun
          </label>
          <input
            id="document-year"
            type="number"
            required
            min={2000}
            max={2100}
            step={1}
            value={form.year}
            onChange={(event) => setField("year", event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label
            htmlFor="document-url"
            className="mb-2 block font-bold text-gray-700"
          >
            Tautan dokumen (HTTPS)
          </label>
          <input
            id="document-url"
            type="url"
            required
            maxLength={2048}
            pattern="https://.*"
            placeholder="https://drive.google.com/..."
            value={form.url}
            onChange={(event) => setField("url", event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="document-description"
            className="mb-2 block font-bold text-gray-700"
          >
            Deskripsi
          </label>
          <textarea
            id="document-description"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
          />
          <p className="mt-1 text-xs text-gray-500">Maksimal 500 karakter.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
          >
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan perubahan"
                : "Tambah dokumen"}
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
          <LoadingSkeleton rows={3} label="Memuat dokumen..." />
        ) : documents.length ? (
          <ul className="divide-y divide-gray-100">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-gray-900">
                    {document.title}{" "}
                    <span className="font-medium text-gray-500">
                      ({document.year})
                    </span>
                  </p>
                  {document.description && (
                    <p className="mt-1 break-words text-sm text-gray-600">
                      {document.description}
                    </p>
                  )}
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block break-all text-sm font-semibold text-green-700 hover:underline"
                  >
                    {document.url}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(document)}
                    className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDocument(document)}
                    className="min-h-[44px] rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="file-shield"
            title="Belum ada dokumen"
            description="Tambahkan tautan laporan agar warga bisa membuka dokumen resmi di halaman Transparansi."
          />
        )}
      </div>
    </section>
  );
}

export default AdminDocuments;
