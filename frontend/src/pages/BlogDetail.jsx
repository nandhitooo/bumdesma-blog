import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
    <main className="min-h-screen bg-gray-50 px-6 pb-20 pt-32">
      {loading ? (
        <p className="py-20 text-center font-semibold text-gray-500">
          Memuat artikel...
        </p>
      ) : article ? (
        <Motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-md"
        >
          {article.coverImageUrl && (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="max-h-[32rem] w-full object-cover"
            />
          )}
          <div className="px-6 py-8 md:px-12 md:py-12">
            <Link
              to="/blog"
              className="mb-8 inline-flex items-center gap-2 font-bold text-green-700 transition hover:text-green-900"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
              Kembali ke Blog
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {article.categoryName && (
                <span className="rounded-full bg-green-50 px-4 py-1.5 font-bold text-green-700">
                  {article.categoryName}
                </span>
              )}
              {article.authorName && <span>Oleh {article.authorName}</span>}
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {dateFormatter.format(new Date(article.publishedAt))}
                </time>
              )}
            </div>

            <h1 className="mb-8 text-3xl font-extrabold leading-tight text-gray-900 md:text-5xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mb-8 border-l-4 border-green-700 pl-5 text-lg leading-relaxed text-gray-600">
                {article.excerpt}
              </p>
            )}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          </div>
        </Motion.article>
      ) : (
        <div className="mx-auto max-w-2xl rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="mb-3 text-3xl font-extrabold text-gray-900">
            Artikel tidak ditemukan
          </h1>
          <p role="alert" className="mb-8 text-gray-600">
            {error || "Artikel ini tidak tersedia atau belum dipublikasikan."}
          </p>
          <Link
            to="/blog"
            className="inline-flex rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
          >
            Kembali ke Blog
          </Link>
        </div>
      )}
    </main>
  );
}

export default BlogDetail;
