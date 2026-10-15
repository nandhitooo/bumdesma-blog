import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";

function AdminArticles() {
  const { user } = useOutletContext();
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState("");
  const loading = result?.key !== `${filter}:${refreshKey}`;
  const articles = loading ? [] : result.articles;
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

  const deleteArticle = useCallback(async (article) => {
    if (!window.confirm(`Hapus artikel “${article.title}”?`)) return;
    setActionError("");
    try {
      await adminApi(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }, []);

  const toggleStatus = async (article) => {
    setActionError("");
    try {
      await adminApi(`/api/admin/articles/${article.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: article.status === "published" ? "draft" : "published",
        }),
      });
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setActionError(requestError.message);
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-green-700">Konten</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Artikel</h1>
          <p className="mt-2 text-gray-600">
            {user.role === "admin" ? "Kelola seluruh artikel." : "Kelola artikel Anda."}
          </p>
        </div>
        <Link
          to="/admin/articles/new"
          className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800"
        >
          <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i>
          Tulis artikel
        </Link>
      </header>

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Filter status artikel">
        {[
          ["all", "Semua"],
          ["draft", "Draf"],
          ["published", "Terbit"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              filter === value
                ? "bg-green-700 text-white"
                : "bg-white text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {actionError || error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-gray-500">Memuat artikel...</p>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {articles.length ? (
            <ul className="divide-y divide-gray-100">
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-gray-900">
                      {article.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span
                        className={`rounded-full px-3 py-1 font-bold ${
                          article.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {article.status === "published" ? "Terbit" : "Draf"}
                      </span>
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
                        className="rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-800 hover:bg-green-100"
                      >
                        {article.status === "published" ? "Jadikan draf" : "Terbitkan"}
                      </button>
                    )}
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                    >
                      Ubah
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteArticle(article)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                    >
                      Hapus
                    </button>
                    {article.status === "published" && (
                      <Link
                        to={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
                      >
                        Lihat
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-14 text-center text-gray-500">
              Tidak ada artikel untuk filter ini.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminArticles;
