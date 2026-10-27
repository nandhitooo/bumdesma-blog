import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";

const PAGE_SIZE = 50;

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const COLUMNS = ["Waktu", "Pengguna", "Aksi", "Entitas", "ID"];

function AuditLog() {
  const { user } = useOutletContext();
  const [page, setPage] = useState(1);
  // Halaman yang hasilnya sudah diterima disimpan bersama datanya; status
  // memuat diturunkan dari situ supaya effect tidak memanggil setState langsung.
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint sama sekali, sehingga
    // tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    if (user.role !== "admin") return undefined;

    const controller = new AbortController();
    adminApi(`/api/admin/audit-logs?page=${page}&limit=${PAGE_SIZE}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setResult({ ...data, page, error: "" });
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setResult({
          logs: [],
          total: 0,
          totalPages: 0,
          page,
          error: requestError.message,
        });
      });

    return () => controller.abort();
  }, [page, user.role]);

  if (user.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Log aktivitas hanya tersedia untuk admin.
      </p>
    );
  }

  const loading = result?.page !== page;
  const logs = loading ? [] : result.logs;
  const error = loading ? "" : result.error;
  const totalPages = loading ? 0 : result.totalPages;
  const total = loading ? 0 : result.total;

  return (
    <section className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Sistem"
        title="Log aktivitas"
        description="Catatan aksi admin dan editor di panel. Hanya jenis aksi dan nama data yang disimpan — isi artikel, password, dan token tidak pernah dicatat."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={6} label="Memuat log aktivitas..." />
        ) : logs.length ? (
          <>
            <ul className="divide-y divide-gray-100 sm:hidden">
              {logs.map((log) => (
                <li key={log.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time
                      dateTime={log.createdAt}
                      className="text-xs text-gray-500"
                    >
                      {dateTimeFormatter.format(new Date(log.createdAt))}
                    </time>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                      {log.action}
                    </span>
                  </div>
                  {log.detail?.ip && (
                    <p className="mt-1 text-xs text-gray-500">{log.detail.ip}</p>
                  )}
                  <p className="mt-2 break-words font-semibold text-gray-900">
                    {log.userName || "—"}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-gray-600">
                    {log.entity}
                    {log.entityId != null ? ` #${log.entityId}` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">
                Daftar aktivitas panel admin, terbaru lebih dulu
              </caption>
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {COLUMNS.map((column) => (
                    <th key={column} scope="col" className="px-5 py-3 font-bold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      <time dateTime={log.createdAt}>
                        {dateTimeFormatter.format(new Date(log.createdAt))}
                      </time>
                    </td>
                    <td className="break-words px-5 py-3 font-semibold text-gray-900" title={log.userName || "—"}>
                      {log.userName || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block break-words rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                        {log.action}
                      </span>
                      {log.detail?.ip && (
                        <p className="mt-1 text-xs text-gray-500">
                          {log.detail.ip}
                        </p>
                      )}
                    </td>
                    <td className="break-words px-5 py-3 text-gray-700" title={log.entity}>
                      {log.entity}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {log.entityId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            icon="clipboard-list"
            title="Belum ada aktivitas"
            description="Setiap perubahan yang disimpan admin atau editor akan tercatat di sini."
          />
        )}
      </div>

      {!loading && totalPages > 0 && (
        <nav
          aria-label="Navigasi halaman log aktivitas"
          className="mt-6 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-gray-600">
            Halaman {page} dari {totalPages} · {total} aktivitas
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="min-h-[44px] rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="min-h-[44px] rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

export default AuditLog;
