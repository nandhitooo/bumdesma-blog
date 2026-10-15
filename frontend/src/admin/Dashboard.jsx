import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";

function AdminDashboard() {
  const { user } = useOutletContext();
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi("/api/admin/articles")
      .then(({ articles: results }) => {
        if (active) setArticles(results);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const drafts = articles.filter((article) => article.status === "draft").length;
  const published = articles.filter((article) => article.status === "published").length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="font-bold text-green-700">Panel pengelola</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
          Selamat datang, {user.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Kelola berita dan informasi BUMDESMA Podo Rukun LKD.
        </p>
      </header>

      {error && <p role="alert" className="mb-5 text-red-700">{error}</p>}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Semua artikel", value: articles.length, icon: "newspaper" },
          { label: "Terbit", value: published, icon: "circle-check" },
          { label: "Draf", value: drafts, icon: "file-lines" },
        ].map((item) => (
          <article key={item.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-600">{item.label}</p>
              <i className={`fa-solid fa-${item.icon} text-xl text-green-700`} aria-hidden="true"></i>
            </div>
            <p className="mt-5 text-4xl font-extrabold text-gray-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Artikel terbaru</h2>
            <p className="mt-1 text-sm text-gray-500">Pembaruan terakhir dari pengelola.</p>
          </div>
          <Link
            to="/admin/articles/new"
            className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white transition hover:bg-green-800"
          >
            <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i>
            Tulis artikel
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {articles.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              to={`/admin/articles/${article.id}/edit`}
              className="flex flex-col justify-between gap-2 py-4 transition hover:text-green-700 sm:flex-row sm:items-center"
            >
              <span className="font-bold text-gray-800">{article.title}</span>
              <span className="text-sm text-gray-500">
                {article.status === "published" ? "Terbit" : "Draf"}
                {" · "}
                {dateFormatter.format(new Date(article.updatedAt))}
              </span>
            </Link>
          ))}
          {!articles.length && !error && (
            <p className="py-8 text-center text-gray-500">Belum ada artikel.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
