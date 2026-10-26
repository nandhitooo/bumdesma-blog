import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { adminApi, dateFormatter } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import StatusBadge from "./components/StatusBadge";
import { useConfirm } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";

// Array kosong yang identitasnya stabil, supaya useMemo pencarian tidak dihitung
// ulang hanya karena daftar sementara ini dibuat baru setiap render.
const NO_ARTICLES = [];

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draf" },
  { value: "published", label: "Terbit" },
];

// Artikel berstatus terbit yang tanggal terbitnya masih di masa depan belum
// tampil di situs publik, jadi daftar admin menandainya sebagai "Terjadwal"
// supaya tidak terlihat seperti artikel yang sudah bisa dibaca.
function isScheduled(article) {
  return (
    article.status === "published" &&
    Boolean(article.publishedAt) &&
    new Date(article.publishedAt).getTime() > Date.now()
  );
}

function AdminArticles() {
  const { user } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState("");
  // Pesan sukses dari halaman editor dibaca sekali saat halaman ini dibuka,
  // lalu ditampilkan sebagai toast supaya tidak perlu ditutup manual.
  const [notice, setNotice] = useState(() => location.state?.notice || "");

  useEffect(() => {
    if (!location.state?.notice) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!notice) return;
    toast.show(notice);
    setNotice("");
    // toast.show stabil (useCallback di provider), cukup dipanggil sekali per notice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  const loading = result?.key !== `${filter}:${refreshKey}`;
  const articles = loading ? NO_ARTICLES : result.articles;
  const error = loading ? "" : result.error;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ status: filter });
    adminApi(`/api/admin/articles?${params}`, { signal: controller.signal })
      .then(({ articles: rows }) => {
        setResult({ key: `${filter}:${refreshKey}`, articles: rows, error: "" });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            key: `${filter}:${refreshKey}`,
            articles: [],
            error: requestError.message,
          });
        }
      });
    return () => controller.abort();
  }, [filter, refreshKey]);

  const query = search.trim().toLowerCase();
  const visibleArticles = useMemo(() => {
    if (!query) return articles;
    return articles.filter((article) =>
      [article.title, article.slug, article.categoryName, article.authorName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [articles, query]);

  const deleteArticle = useCallback(
    async (article) => {
      const confirmed = await confirm({
        title: "Hapus artikel ini?",
        message:
          "Artikel yang dihapus tidak bisa dikembalikan. Revisi lama ikut terhapus.",
        detail: article.title,
        confirmLabel: "Hapus artikel",
      });
      if (!confirmed) return;

      setActionError("");
      try {
        await adminApi(`/api/admin/articles/${article.id}`, { method: "DELETE" });
        toast.show("Artikel berhasil dihapus.");
        setRefreshKey((key) => key + 1);
      } catch (requestError) {
        setActionError(requestError.message);
        toast.show(requestError.message, "error");
      }
    },
    [confirm, toast],
  );

  const toggleStatus = async (article) => {
    setActionError("");
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      await adminApi(`/api/admin/articles/${article.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.show(
        nextStatus === "published"
          ? "Artikel diterbitkan."
          : "Artikel dikembalikan menjadi draf.",
      );
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError.message);
      toast.show(requestError.message, "error");
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Konten"
        title="Artikel"
        description={
          user.role === "admin"
            ? "Kelola seluruh artikel, ubah status terbit, dan hapus yang tidak dipakai."
            : "Kelola artikel Anda. Penerbitan dilakukan oleh admin."
        }
      >
        <Link
          to="/admin/articles/new"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800 motion-reduce:transition-none"
        >
          <i className="fa-solid fa-plus" aria-hidden="true"></i>
          Tulis artikel
        </Link>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filter status artikel">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-bold ${
                filter === item.value
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <label htmlFor="article-search" className="sr-only">
            Cari artikel
          </label>
          <input
            id="article-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul atau kategori..."
            className="min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-2 text-base outline-none focus:border-green-700"
          />
        </div>
      </div>

      {(error || actionError) && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {actionError || error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton rows={5} label="Memuat artikel..." />
        ) : visibleArticles.length ? (
          <ul className="divide-y divide-gray-100">
            {visibleArticles.map((article) => (
              <li
                key={article.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-gray-900">
                    {article.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500">
                    <StatusBadge
                      status={isScheduled(article) ? "scheduled" : article.status}
                    />
                    {isScheduled(article) && (
                      <time dateTime={article.publishedAt} className="font-semibold text-blue-700">
                        Terbit {dateFormatter.format(new Date(article.publishedAt))}
                      </time>
                    )}
                    {article.categoryName && <span>{article.categoryName}</span>}
                    {user.role === "admin" && article.authorName && (
                      <span>Oleh {article.authorName}</span>
                    )}
                    <time dateTime={article.updatedAt}>
                      Diperbarui {dateFormatter.format(new Date(article.updatedAt))}
                    </time>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(article)}
                      className="min-h-[44px] rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-800 hover:bg-green-100"
                    >
                      {article.status === "published" ? "Jadikan draf" : "Terbitkan"}
                    </button>
                  )}
                  <Link
                    to={`/admin/articles/${article.id}/edit`}
                    className="min-h-[44px] rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteArticle(article)}
                    className="min-h-[44px] rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                  {article.status === "published" && (
                    <Link
                      to={`/blog/${article.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
                    >
                      Lihat
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : query ? (
          <EmptyState
            icon="magnifying-glass"
            title="Tidak ada artikel yang cocok"
            description={`Tidak ada judul atau kategori yang memuat “${search.trim()}” pada filter ini.`}
          >
            <button
              type="button"
              onClick={() => setSearch("")}
              className="min-h-[44px] rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
            >
              Hapus pencarian
            </button>
          </EmptyState>
        ) : (
          <EmptyState
            icon="newspaper"
            title="Belum ada artikel di filter ini"
            description="Mulai dengan membuat draf baru, atau pilih filter lain untuk melihat artikel yang sudah ada."
          >
            <Link
              to="/admin/articles/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
            >
              Tulis artikel
            </Link>
          </EmptyState>
        )}
      </div>
    </section>
  );
}

export default AdminArticles;
