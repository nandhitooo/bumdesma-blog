import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArticleView from "../components/ArticleView";

function BlogDetail() {
  const { slug } = useParams();
  const [result, setResult] = useState(null);
  const loading = result?.slug !== slug;
  const article = result?.slug === slug ? result.article : null;
  const error = result?.slug === slug ? result.error : "";

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/articles/${encodeURIComponent(slug)}`, {
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
    <main className="min-h-screen bg-white py-12 sm:py-16">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            Memuat artikel...
          </div>
        ) : article ? (
          <article>
            {/* Back link */}
            <div className="mb-6">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
              >
                <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
                <span>Kembali ke Blog</span>
              </Link>
            </div>

            <ArticleView article={article} />

            {/* Bottom Back Link */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
              >
                <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
                <span>Kembali ke Daftar Blog</span>
              </Link>
            </div>
          </article>
        ) : (
          <div className="border border-gray-200 rounded-xl p-10 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Artikel tidak ditemukan
            </h1>
            <p role="alert" className="text-sm text-gray-600 mb-6">
              {error || "Artikel ini tidak tersedia atau belum dipublikasikan."}
            </p>
            <Link
              to="/blog"
              className="inline-flex bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
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
