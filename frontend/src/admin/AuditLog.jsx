import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";

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
      <header className="mb-7">
        <p className="font-bold text-green-700">Sistem</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
          Log aktivitas
        </h1>
        <p className="mt-2 text-gray-600">
          Catatan aksi admin dan editor di panel. Hanya nama aksi, entitas, dan
          id yang disimpan — isi artikel, password, dan token tidak pernah
          dicatat.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Memuat log aktivitas...</p>
        ) : logs.length ? (
          <div className="overflow-x-auto">
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
        ) : (
          <p className="px-6 py-14 text-center text-gray-500">
            Belum ada aktivitas tercatat.
          </p>
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
