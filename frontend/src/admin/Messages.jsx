import { useEffect, useState } from "react";
import { adminApi, dateFormatter } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

const PAGE_SIZE = 20;

export default function AdminMessages() {
  const confirm = useConfirm();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi(`/api/admin/messages?page=${page}&limit=${PAGE_SIZE}`)
      .then((data) => {
        if (!active) return;
        setMessages(data.messages);
        setPagination(data.pagination);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  const markRead = async (contactMessage) => {
    setError("");
    try {
      await adminApi(`/api/admin/messages/${contactMessage.id}/read`, {
        method: "PATCH",
      });
      toast.show("Pesan ditandai sudah dibaca.");
      refresh();
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  const deleteMessage = async (contactMessage) => {
    const confirmed = await confirm({
      title: "Hapus pesan ini?",
      message:
        "Pesan akan hilang dari kotak masuk dan tidak bisa dibuka lagi. Tindakan ini tidak bisa dibatalkan.",
      detail: contactMessage.name,
      confirmLabel: "Hapus pesan",
    });
    if (!confirmed) return;

    setError("");
    try {
      await adminApi(`/api/admin/messages/${contactMessage.id}`, {
        method: "DELETE",
      });
      toast.show("Pesan berhasil dihapus.");
      // Halaman terakhir bisa jadi kosong setelah penghapusan terakhir.
      if (messages.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refresh();
      }
    } catch (requestError) {
      setError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Konten"
        title="Pesan Masuk"
        description="Pesan yang dikirim masyarakat lewat formulir kontak di halaman utama situs."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={3} label="Memuat pesan masuk..." />
        ) : messages.length === 0 ? (
          <EmptyState
            icon="envelope-open"
            title="Belum ada pesan masuk"
            description="Pesan baru dari formulir kontak akan tampil di sini beserta kontak pengirimnya."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {messages.map((contactMessage) => (
              <li key={contactMessage.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-extrabold text-gray-900">
                        {contactMessage.name}
                      </h2>
                      {contactMessage.isRead ? (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          Sudah dibaca
                        </span>
                      ) : (
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Belum dibaca
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-gray-600">
                      <a
                        href={`mailto:${contactMessage.email}`}
                        className="font-medium text-green-800 underline-offset-2 hover:underline"
                      >
                        {contactMessage.email}
                      </a>
                      {contactMessage.phone && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{contactMessage.phone}</span>
                        </>
                      )}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={contactMessage.createdAt}>
                        {dateFormatter.format(new Date(contactMessage.createdAt))}
                      </time>
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!contactMessage.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead(contactMessage)}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                      >
                        <i className="fa-solid fa-check" aria-hidden="true"></i>
                        Tandai dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMessage(contactMessage)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      Hapus
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                  {contactMessage.message}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:px-6">
            <p>
              Halaman {pagination.page} dari {pagination.totalPages} ·{" "}
              {pagination.total} pesan
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1}
                className="min-h-[40px] rounded-xl border border-gray-200 px-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                disabled={pagination.page >= pagination.totalPages}
                className="min-h-[40px] rounded-xl border border-gray-200 px-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
