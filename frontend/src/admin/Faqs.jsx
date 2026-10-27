import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Modal from "./components/Modal";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

const EMPTY_FORM = { question: "", answer: "", sortOrder: "0" };

function AdminFaqs() {
  const { user } = useOutletContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [faqs, setFaqs] = useState([]);
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
    adminApi("/api/admin/faqs")
      .then(({ faqs: rows }) => {
        if (active) {
          setFaqs(rows);
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
        Akses ditolak. Pengelolaan FAQ hanya tersedia untuk admin.
      </p>
    );
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = editingId ? `/api/admin/faqs/${editingId}` : "/api/admin/faqs";
      await adminApi(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      toast.show(editingId ? "FAQ diperbarui." : "FAQ ditambahkan.");
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (faq) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      sortOrder: String(faq.sortOrder),
    });
    setEditingId(faq.id);
    setError("");
  };

  const deleteFaq = async (faq) => {
    const confirmed = await confirm({
      title: "Hapus FAQ ini?",
      message:
        "Pertanyaan dan jawabannya akan hilang dari halaman FAQ publik. Tindakan ini tidak bisa dibatalkan.",
      detail: faq.question,
      confirmLabel: "Hapus FAQ",
    });
    if (!confirmed) return;

    setError("");
    try {
      await adminApi(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });
      toast.show("FAQ berhasil dihapus.");
      if (editingId === faq.id) resetForm();
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
      <div className="md:col-span-2">
        <label
          htmlFor="faq-question"
          className="mb-2 block font-bold text-gray-700"
        >
          Pertanyaan
        </label>
        <input
          id="faq-question"
          required
          maxLength={300}
          value={form.question}
          onChange={(event) => setField("question", event.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="faq-answer"
          className="mb-2 block font-bold text-gray-700"
        >
          Jawaban
        </label>
        <textarea
          id="faq-answer"
          required
          rows={5}
          maxLength={2000}
          value={form.answer}
          onChange={(event) => setField("answer", event.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Maksimal 2000 karakter. Baris baru dipertahankan saat ditampilkan.
        </p>
      </div>

      <div>
        <label
          htmlFor="faq-sort"
          className="mb-2 block font-bold text-gray-700"
        >
          Urutan
        </label>
        <input
          id="faq-sort"
          type="number"
          min={0}
          max={9999}
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
              : "Tambah FAQ"}
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
        eyebrow="Konten"
        title="FAQ"
        description="Kelola pertanyaan umum yang tampil di halaman publik FAQ. Isi berupa teks biasa; baris baru pada jawaban tetap ditampilkan."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {editingId ? (
        <Modal title="Ubah FAQ" error={error} onClose={resetForm}>
          {formElement}
        </Modal>
      ) : (
        formElement
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={3} label="Memuat FAQ..." />
        ) : faqs.length ? (
          <ul className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <li
                key={faq.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-gray-900">{faq.question}</p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-600">
                    {faq.answer}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Urutan: {faq.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(faq)}
                    className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFaq(faq)}
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
            icon="circle-question"
            title="Belum ada FAQ"
            description="Tambahkan pertanyaan yang paling sering diajukan warga agar halaman FAQ tidak kosong."
          />
        )}
      </div>
    </section>
  );
}

export default AdminFaqs;

