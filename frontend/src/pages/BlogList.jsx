import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ArticleImage from "../components/ArticleImage";
import { formatDate } from "../lib/date";
import { apiUrl } from "../lib/apiUrl";
import { useSiteContent } from "../lib/siteContent";
import { usePageTitle } from "../lib/usePageTitle";

function BlogList() {
  const { sections } = useSiteContent();
  usePageTitle("Blog");
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [articleResult, setArticleResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const pageParam = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;
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
    setSearch(query);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/categories"), { signal: controller.signal })
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

    fetch(apiUrl(`/api/articles?${params}`), { signal: controller.signal })
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
      });

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

  const showFeatured = page === 1 && !query && !category && articles.length > 0;
  const featuredArticle = showFeatured ? articles[0] : null;
  const gridArticles = showFeatured ? articles.slice(1) : articles;

  return (
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Blog</span>
        </nav>

        {/* Uniform Page Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            {sections.blog.eyebrow}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-1 mb-3 break-words">
            {sections.blog.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {sections.blog.description}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0" aria-label="Filter kategori">
            <button
              type="button"
              onClick={() => updateFilters({ category: "" })}
              className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-colors motion-reduce:transition-none cursor-pointer flex items-center ${
                !category
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Semua
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateFilters({ category: item.slug })}
                className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-colors motion-reduce:transition-none cursor-pointer flex items-center ${
                  category === item.slug
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <form onSubmit={submitSearch} className="flex min-w-0 w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
            <label className="sr-only" htmlFor="blog-search">
              Cari artikel
            </label>
            <input
              id="blog-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari artikel..."
              className="w-full sm:w-60 min-h-[44px] px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors motion-reduce:transition-none text-gray-900"
            />
            <button
              type="submit"
              className="min-h-[44px] bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm transition-colors motion-reduce:transition-none cursor-pointer flex items-center justify-center shrink-0"
            >
              Cari
            </button>
          </form>
        </div>

        {error && (
          <div role="alert" className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            Memuat artikel...
          </div>
        ) : articles.length ? (
          <div className="space-y-8">
            {/* 1 Artikel Unggulan Besar di Atas */}
            {featuredArticle && (
              <article className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-gray-300 transition-colors motion-reduce:transition-none">
                <Link to={`/blog/${featuredArticle.slug}`} className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto bg-gray-100 overflow-hidden">
                    <ArticleImage
                      src={featuredArticle.coverImageUrl}
                      alt={featuredArticle.title}
                      containerClassName="w-full h-full min-h-[260px]"
                      className="transition-opacity motion-reduce:transition-none duration-300 group-hover:opacity-90"
                    />
                  </div>
                  <div className="lg:col-span-5 min-w-0 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="bg-brand-light text-brand-primary font-semibold px-2.5 py-1 rounded">
                          {featuredArticle.categoryName || "Umum"}
                        </span>
                        {featuredArticle.publishedAt && (
                          <time dateTime={featuredArticle.publishedAt}>
                            {formatDate(featuredArticle.publishedAt)}
                          </time>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors motion-reduce:transition-none leading-snug mb-3 break-words line-clamp-2">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-sm text-gray-600 leading-relaxed mb-6 break-words line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary group-hover:text-brand-dark transition-colors motion-reduce:transition-none">
                      <span>Baca artikel lengkap</span>
                      <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
                    </span>
                  </div>
                </Link>
              </article>
            )}

            {/* Grid Kartu: 1 kolom (mobile) / 2 kolom (tablet) / 3 kolom (desktop) */}
            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArticles.map((article) => (
                  <article
                    key={article.id}
                    className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col"
                  >
                    <Link to={`/blog/${article.slug}`} className="flex-1 flex flex-col">
                      <ArticleImage
                        src={article.coverImageUrl}
                        alt={article.title}
                        aspectRatio="aspect-[16/9]"
                        containerClassName="w-full bg-gray-100"
                        className="transition-opacity motion-reduce:transition-none duration-300 group-hover:opacity-90"
                      />

                      <div className="min-w-0 p-5 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5">
                            {article.categoryName && (
                              <span className="bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded">
                                {article.categoryName}
                              </span>
                            )}
                            {article.publishedAt && (
                              <time dateTime={article.publishedAt}>
                                {formatDate(article.publishedAt)}
                              </time>
                            )}
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-brand-primary transition-colors motion-reduce:transition-none leading-snug mb-2 break-words line-clamp-2">
                            {article.title}
                          </h2>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 break-words">
                            {article.excerpt}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                          <span>Baca selengkapnya</span>
                          <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true"></i>
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {sections.blog.emptyTitle}
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              {sections.blog.emptyText}
            </p>
            {(category || query) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchParams(new URLSearchParams());
                }}
                className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
              >
                Reset Filter Pencarian
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && !loading && (
          <nav
            aria-label="Navigasi halaman artikel"
            className="mt-12 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters({ page: String(pagination.page - 1) })}
              className="min-h-[44px] px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors motion-reduce:transition-none cursor-pointer flex items-center"
            >
              Sebelumnya
            </button>
            <span className="px-3 text-xs font-semibold text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters({ page: String(pagination.page + 1) })}
              className="min-h-[44px] px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors motion-reduce:transition-none cursor-pointer flex items-center"
            >
              Selanjutnya
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

export default BlogList;
