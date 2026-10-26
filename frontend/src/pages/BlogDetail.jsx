import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArticleView from "../components/ArticleView";
import ShareButtons from "../components/ShareButtons";
import RelatedArticles from "../components/RelatedArticles";
import { apiUrl } from "../lib/apiUrl";

function BlogDetail() {
  const { slug } = useParams();
  const [result, setResult] = useState(null);
  const loading = result?.slug !== slug;
  const article = result?.slug === slug ? result.article : null;
  const error = result?.slug === slug ? result.error : "";

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/articles/${encodeURIComponent(slug)}`), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Artikel tidak ditemukan.");
        return data.article;
      })
      .then((data) => {
        setResult({ slug, article: data, error: "" });
        document.title = `${data.title} | BUMDESMA Podo Rukun LKD`;
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setResult({ slug, article: null, error: fetchError.message });
          document.title = "Artikel tidak ditemukan | BUMDESMA Podo Rukun LKD";
        }
      });

    return () => {
      controller.abort();
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, [slug]);

  return (
    <main className="min-h-dvh bg-white py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <Link to="/blog" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Blog
          </Link>
          {article?.title && (
            <>
              <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
              <span className="truncate max-w-[200px] sm:max-w-xs text-gray-900 font-medium">
                {article.title}
              </span>
            </>
          )}
        </nav>

        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            Memuat artikel...
          </div>
        ) : article ? (
          <article>
            <div className="mb-6">
              <Link
                to="/blog"
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
              >
                <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
                <span>Kembali ke Blog</span>
              </Link>
            </div>

            <ArticleView article={article} />

            <ShareButtons title={article.title} slug={article.slug} />
            <RelatedArticles slug={article.slug} />

            {/* Bottom Back Link */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6">
              <Link
                to="/blog"
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
              >
                <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
                <span>Kembali ke Daftar Blog</span>
              </Link>
            </div>
          </article>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 sm:p-12 text-center bg-gray-50 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">
              Artikel tidak ditemukan
            </h1>
            <p role="alert" className="text-sm text-gray-600 mb-6 break-words">
              {error || "Artikel ini tidak tersedia atau belum dipublikasikan."}
            </p>
            <Link
              to="/blog"
              className="inline-flex min-h-[44px] items-center justify-center bg-brand-primary px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-colors motion-reduce:transition-none hover:bg-brand-dark"
            >
              Kembali ke Blog
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default BlogDetail;
