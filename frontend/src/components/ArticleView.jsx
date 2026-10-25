import ArticleImage from "./ArticleImage";
import { formatDate } from "../lib/date";

// Tata letak badan artikel dipakai bersama oleh halaman blog publik
// (pages/BlogDetail.jsx) dan pratinjau di editor, supaya penulis melihat hasil
// yang persis sama dengan yang nanti terbit. Pembungkus <article> dan tautan
// navigasi tetap milik masing-masing halaman.
//
// showPlaceholders hanya dipakai pratinjau: isi yang masih kosong ditandai
// dengan teks abu-abu, bukan dibiarkan sebagai area kosong. Halaman publik
// memakai nilai bawaan (false) sehingga tampilannya tidak berubah.
// Editor yang masih kosong tetap menghasilkan "<p></p>", jadi isi dianggap
// kosong hanya bila tidak ada teks sama sekali (gambar/garis pemisah tetap
// dihitung sebagai isi).
function hasVisibleContent(html) {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return Boolean(text) || /<(?:img|hr|iframe|video|audio)\b/i.test(html);
}

function ArticleView({ article, showPlaceholders = false }) {
  const {
    title,
    excerpt,
    categoryName,
    authorName,
    publishedAt,
    coverImageUrl,
    contentHtml,
  } = article;

  const hasTitle = Boolean(title && title.trim());
  const hasExcerpt = Boolean(excerpt && excerpt.trim());
  const hasContent = hasVisibleContent(contentHtml);

  return (
    <>
      {/* Meta Line */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
        {categoryName && (
          <span className="bg-brand-light text-brand-primary font-semibold px-2.5 py-1 rounded">
            {categoryName}
          </span>
        )}
        {authorName && <span>Oleh {authorName}</span>}
        {publishedAt && (
          <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-6 break-words">
        {hasTitle ? (
          title
        ) : showPlaceholders ? (
          <span className="text-gray-400">Judul belum diisi</span>
        ) : null}
      </h1>

      {/* Excerpt */}
      {hasExcerpt ? (
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed pl-4 border-l-2 border-brand-primary mb-8 italic break-words">
          {excerpt}
        </p>
      ) : (
        showPlaceholders && (
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed pl-4 border-l-2 border-gray-300 mb-8 italic">
            Ringkasan belum diisi
          </p>
        )
      )}

      {/* Cover Image */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
        <ArticleImage
          src={coverImageUrl}
          alt={title || ""}
          containerClassName="w-full max-h-[440px] aspect-[16/9]"
          iconSize="text-5xl"
          loading="eager"
        />
      </div>

      {/* Article Content */}
      {hasContent ? (
        <div
          className="article-content max-w-prose break-words [&_code]:break-words [&_iframe]:aspect-video [&_iframe]:w-full [&_img]:h-auto [&_img]:max-w-full [&_p]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_video]:aspect-video [&_video]:w-full"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      ) : showPlaceholders ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm font-medium text-gray-400">
          Isi artikel belum diisi
        </p>
      ) : (
        <div className="article-content max-w-prose" />
      )}
    </>
  );
}

export default ArticleView;
