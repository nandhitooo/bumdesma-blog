import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [articleResult, setArticleResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const page = Number(searchParams.get("page") || 1);
  const category = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";
  const requestKey = `${page}:${category}:${query}`;
  const loading = articleResult?.key !== requestKey;
  const articles =
    articleResult?.key === requestKey ? articleResult.articles : [];
  const pagination =
    articleResult?.key === requestKey
      ? articleResult.pagination
      : { page, totalPages: 0 };
  const error =
    articleResult?.key === requestKey
      ? articleResult.error || categoryError
      : categoryError;

  useEffect(() => {
    document.title = "Blog | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat kategori.");
        return response.json();
      })
      .then((data) => setCategories(data.categories))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          console.error("Gagal memuat kategori:", fetchError);
          setCategoryError("Kategori belum dapat dimuat. Coba muat ulang halaman.");
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (category) params.set("category", category);
    if (query) params.set("q", query);

    fetch(`/api/articles?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat artikel.");
        return response.json();
      })
      .then((data) => {
        setArticleResult({
          key: requestKey,
          articles: data.articles,
          pagination: { page: data.page, totalPages: data.totalPages },
          error: "",
        });
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          console.error("Gagal memuat artikel:", fetchError);
          setArticleResult({
            key: requestKey,
            articles: [],
            pagination: { page, totalPages: 0 },
            error: "Artikel belum dapat dimuat. Coba muat ulang halaman.",
          });
        }
      })

    return () => controller.abort();
  }, [category, page, query, requestKey]);

  const updateFilters = (updates) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!Object.hasOwn(updates, "page")) params.delete("page");
    setSearchParams(params);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateFilters({ q: search.trim() });
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-20">
      <section className="container mx-auto px-6">
        <Motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="mb-3 font-bold uppercase tracking-[0.2em] text-green-700">
            Kabar dan cerita
          </p>
          <h1 className="mb-5 text-4xl font-extrabold text-gray-900 md:text-5xl">
            Blog <span className="text-green-700">Podo Rukun</span>
          </h1>
          <p className="text-lg leading-relaxed text-gray-600">
            Informasi, kegiatan, dan cerita terbaru dari BUMDESMA Podo Rukun
            LKD.
          </p>
        </Motion.header>

        <div className="mb-10 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filter kategori">
            <button
              type="button"
              onClick={() => updateFilters({ category: "" })}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                !category
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              Semua
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateFilters({ category: item.slug })}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  category === item.slug
                    ? "bg-green-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <form onSubmit={submitSearch} className="flex gap-2">
            <label className="sr-only" htmlFor="blog-search">
              Cari artikel
            </label>
            <input
              id="blog-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari artikel..."
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-700 md:w-56"
            />
            <button
              type="submit"
              className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800"
            >
              Cari
            </button>
          </form>
        </div>

        {error && (
          <p role="alert" className="mb-8 rounded-2xl bg-red-50 p-5 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-16 text-center font-semibold text-gray-500">
            Memuat artikel...
          </p>
        ) : articles.length ? (
          <Motion.div
            layout
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {articles.map((article) => (
              <Motion.article
                key={article.id}
                layout
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition hover:shadow-xl"
              >
                <Link to={`/blog/${article.slug}`} className="block h-full">
                  {article.coverImageUrl ? (
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-green-50 text-5xl text-green-700">
                      <i className="fa-regular fa-newspaper" aria-hidden="true"></i>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {article.categoryName && (
                        <span className="rounded-full bg-green-50 px-3 py-1 font-bold text-green-700">
                          {article.categoryName}
                        </span>
                      )}
                      {article.publishedAt && (
                        <time dateTime={article.publishedAt}>
                          {dateFormatter.format(new Date(article.publishedAt))}
                        </time>
                      )}
                    </div>
                    <h2 className="mb-3 text-xl font-bold leading-snug text-gray-900 transition-colors group-hover:text-green-700">
                      {article.title}
                    </h2>
                    <p className="line-clamp-3 leading-relaxed text-gray-600">
                      {article.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-bold text-green-700">
                      Baca selengkapnya
                      <i className="fa-solid fa-arrow-right text-sm" aria-hidden="true"></i>
                    </span>
                  </div>
                </Link>
              </Motion.article>
            ))}
          </Motion.div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              Belum ada artikel
            </h2>
            <p className="text-gray-600">
              Artikel yang sesuai belum tersedia.
            </p>
          </div>
        )}

        {pagination.totalPages > 1 && !loading && (
          <nav
            aria-label="Navigasi halaman artikel"
            className="mt-12 flex items-center justify-center gap-4"
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters({ page: String(pagination.page - 1) })}
              className="rounded-xl bg-white px-5 py-3 font-bold text-green-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="font-bold text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters({ page: String(pagination.page + 1) })}
              className="rounded-xl bg-white px-5 py-3 font-bold text-green-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default BlogList;
