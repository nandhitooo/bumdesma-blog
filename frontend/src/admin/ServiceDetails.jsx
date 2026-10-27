import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi, toSlug } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Modal from "./components/Modal";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

const EMPTY_FORM = {
  slug: "",
  title: "",
  summary: "",
  requirements: "",
  steps: "",
  sortOrder: "0",
};

// Satu butir per baris; baris kosong dibuang supaya tidak ada butir kosong yang
// ikut tersimpan.
function toLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function AdminServiceDetails() {
  const { user } = useOutletContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/service-details")
      .then(({ services: rows }) => {
        if (active) {
          setServices(rows);
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
        Akses ditolak. Pengelolaan detail layanan hanya tersedia untuk admin.
      </p>
    );
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
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
        ? `/api/admin/service-details/${editingId}`
        : "/api/admin/service-details";
      await adminApi(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          summary: form.summary,
          requirements: toLines(form.requirements),
          steps: toLines(form.steps),
          sortOrder: form.sortOrder,
        }),
      });
      toast.show(
        editingId ? "Detail layanan diperbarui." : "Detail layanan ditambahkan.",
      );
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (service) => {
    setForm({
      slug: service.slug,
      title: service.title,
      summary: service.summary || "",
      requirements: (service.requirements || []).join("\n"),
      steps: (service.steps || []).join("\n"),
      sortOrder: String(service.sortOrder),
    });
    setEditingId(service.id);
    setSlugEdited(true);
    setError("");
  };

  const deleteService = async (service) => {
    const confirmed = await confirm({
      title: "Hapus detail layanan ini?",
      message:
        "Syarat dan alur pengajuan layanan ini akan hilang dari halaman publik Layanan.",
      detail: service.title,
      confirmLabel: "Hapus layanan",
    });
    if (!confirmed) return;

    setError("");
    try {
      await adminApi(`/api/admin/service-details/${service.id}`, {
        method: "DELETE",
      });
      toast.show("Detail layanan berhasil dihapus.");
      if (editingId === service.id) resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  const formElement = (
    <form
      onSubmit={submit}
      className={`${
        editingId ? "" : "mb-7 rounded-3xl bg-white p-5 shadow-sm sm:p-7"
      } grid grid-cols-1 gap-4 md:grid-cols-2`}
    >
      <div>
        <label
          htmlFor="service-title"
          className="mb-2 block font-bold text-gray-700"
        >
          Judul layanan
        </label>
        <input
          id="service-title"
          required
          maxLength={150}
          value={form.title}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({
              ...current,
              title: value,
              ...(!slugEdited ? { slug: toSlug(value) } : {}),
            }));
          }}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
      </div>

      <div>
        <label
          htmlFor="service-slug"
          className="mb-2 block font-bold text-gray-700"
        >
          Alamat halaman
        </label>
        <input
          id="service-slug"
          required
          maxLength={120}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={form.slug}
          onChange={(event) => {
            setSlugEdited(true);
            setField("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
          }}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Dipakai di alamat halaman layanan, mis. “dana-bergulir”. Dibuat otomatis dari judul.
        </p>
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="service-summary"
          className="mb-2 block font-bold text-gray-700"
        >
          Ringkasan
        </label>
        <textarea
          id="service-summary"
          rows={3}
          maxLength={600}
          value={form.summary}
          onChange={(event) => setField("summary", event.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">Maksimal 600 karakter.</p>
      </div>

      <div>
        <label
          htmlFor="service-requirements"
          className="mb-2 block font-bold text-gray-700"
        >
          Syarat
        </label>
        <textarea
          id="service-requirements"
          rows={6}
          value={form.requirements}
          onChange={(event) => setField("requirements", event.target.value)}
          placeholder={"Satu syarat per baris\nContoh: Fotokopi KTP"}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Satu butir per baris, maksimal 20 butir.
        </p>
      </div>

      <div>
        <label
          htmlFor="service-steps"
          className="mb-2 block font-bold text-gray-700"
        >
          Alur pengajuan
        </label>
        <textarea
          id="service-steps"
          rows={6}
          value={form.steps}
          onChange={(event) => setField("steps", event.target.value)}
          placeholder={"Satu langkah per baris\nContoh: Menyerahkan berkas"}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Satu langkah per baris, urut dari atas, maksimal 20 langkah.
        </p>
      </div>

      <div>
        <label
          htmlFor="service-sort"
          className="mb-2 block font-bold text-gray-700"
        >
          Urutan
        </label>
        <input
          id="service-sort"
          type="number"
          step={1}
          value={form.sortOrder}
          onChange={(event) => setField("sortOrder", event.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Angka kecil tampil lebih dulu.
        </p>
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
              : "Tambah detail layanan"}
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
  );

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Situs"
        title="Detail Layanan"
        description="Atur syarat dan alur pengajuan tiap unit usaha yang tampil di halaman publik Layanan. Tulis satu butir per baris."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {editingId ? (
        <Modal title="Ubah detail layanan" error={error} onClose={resetForm}>
          {formElement}
        </Modal>
      ) : (
        formElement
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={3} label="Memuat layanan..." />
        ) : services.length ? (
          <ul className="divide-y divide-gray-100">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-gray-900">{service.title}</p>
                  <p className="mt-1 break-all text-sm text-gray-500">/{service.slug}</p>
                  {service.summary && (
                    <p className="mt-1 break-words text-sm text-gray-600">
                      {service.summary}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {(service.requirements || []).length} syarat •{" "}
                    {(service.steps || []).length} langkah • urutan{" "}
                    {service.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(service)}
                    className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteService(service)}
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
            icon="circle-info"
            title="Belum ada detail layanan"
            description="Tambahkan syarat dan alur pengajuan agar halaman Layanan bisa dibuka warga."
          />
        )}
      </div>
    </section>
  );
}

export default AdminServiceDetails;

