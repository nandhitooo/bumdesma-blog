import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArticleImage from "./ArticleImage";
import { formatDate } from "../lib/date";

// Bila tidak ada artikel terkait (atau permintaannya gagal), komponen ini
// sengaja tidak menampilkan apa pun: bagian "Artikel Terkait" yang kosong
// hanya menambah derau di halaman detail.
function RelatedArticles({ slug }) {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/articles/${encodeURIComponent(slug)}/related`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat artikel terkait.");
        return response.json();
      })
      .then((data) => {
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat artikel terkait:", fetchError);
        setArticles([]);
      });

    return () => controller.abort();
  }, [slug]);

  if (!articles.length) return null;

  return (
    <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="artikel-terkait-judul">
      <h2
        id="artikel-terkait-judul"
        className="text-sm font-bold text-gray-900 sm:text-base"
      >
        Artikel Terkait
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors motion-reduce:transition-none hover:border-gray-300">
              <Link to={`/blog/${article.slug}`} className="flex h-full flex-col">
                <ArticleImage
                  src={article.coverImageUrl}
                  alt={article.title}
                  containerClassName="h-36 w-full bg-gray-100"
                  className="transition-opacity motion-reduce:transition-none duration-300 group-hover:opacity-90"
                />
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors motion-reduce:transition-none group-hover:text-brand-primary break-words">
                    {article.title}
                  </h3>
                  {article.publishedAt && (
                    <time
                      dateTime={article.publishedAt}
                      className="mt-2 text-xs text-gray-500"
                    >
                      {formatDate(article.publishedAt)}
                    </time>
                  )}
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedArticles;
