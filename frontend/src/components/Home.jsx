import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ArticleImage from "./ArticleImage";
import { useSiteContent } from "../lib/siteContent";
import { isValidIcon, safeImageUrl } from "../lib/siteContentUtils";
import { usePageTitle } from "../lib/usePageTitle";
import { formatDate } from "../lib/date";
import { apiUrl } from "../lib/apiUrl";
import kegiatan1 from "../assets/kegiatan/kegiatan1.jpg";
import kegiatan2 from "../assets/kegiatan/kegiatan2.jpg";
import kegiatan8 from "../assets/kegiatan/kegiatan8.jpg";

const defaultHighlights = [
  {
    id: "fb-1",
    title: "Launching PT LKM ARTHA TANJUNG MANDIRI",
    categoryName: "Bisnis",
    coverImageUrl: kegiatan8,
    excerpt:
      "Langkah strategis pengembangan layanan keuangan mikro desa untuk mendukung permodalan dan penguatan usaha warga.",
    slug: "",
  },
  {
    id: "fb-2",
    title: "Evaluasi Kinerja Tahunan BUMDESMA Podo Rukun",
    categoryName: "Internal",
    coverImageUrl: kegiatan1,
    excerpt:
      "Pertanggungjawaban pengelolaan unit usaha desa dan perencanaan program kerja berkelanjutan.",
    slug: "",
  },
  {
    id: "fb-3",
    title: "Bazar Produk Desa & Pemberdayaan Ekonomi Warga",
    categoryName: "Event",
    coverImageUrl: kegiatan2,
    excerpt:
      "Mendorong promosi produk unggulan masyarakat desa Wilangan agar memiliki daya saing lebih luas.",
    slug: "",
  },
];

const Home = () => {
  const { hero, sections } = useSiteContent();
  usePageTitle();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/articles?limit=4"), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat artikel.");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        } else {
          setArticles([]);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setArticles([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const displayArticles = articles.length > 0 ? articles : defaultHighlights;
  const featuredArticle = displayArticles[0];
  const gridArticles = displayArticles.slice(1, 4);

  return (
    <div id="home" className="scroll-mt-18">
      {/* Hero Section: 2 Columns */}
      <section className="bg-white py-12 md:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Headline & Single CTA */}
            <div className="lg:col-span-7">
              <span className="inline-block text-xs font-semibold tracking-wider text-brand-primary uppercase mb-3">
                {hero.subtitle}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-5 break-words">
                {hero.title}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
                {hero.description}
              </p>
              <div>
                <a
                  href="#berita-terbaru"
                  className="inline-flex min-h-[44px] items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white text-sm sm:text-base font-medium px-6 py-3 rounded-lg shadow-sm transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span>{hero.buttonLabel}</span>
                  <i className="fa-solid fa-arrow-down text-xs" aria-hidden="true"></i>
                </a>
              </div>
            </div>

            {/* Right: Featured Visual / Photo */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-100 aspect-[16/10]">
                <img
                  src={safeImageUrl(hero.imageUrl, kegiatan8)}
                  alt={`Kegiatan ${hero.subtitle}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Highlights: 3 Cards Strip */}
      {Array.isArray(hero.highlights) && hero.highlights.length > 0 && (
        <section className="bg-gray-50 py-10 md:py-14 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hero.highlights.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary mb-4">
                      {isValidIcon(item.icon) && (
                        <i className={`fa-solid fa-${item.icon} text-base`} aria-hidden="true"></i>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 break-words">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section berita terbaru */}
      <section id="berita-terbaru" className="bg-white py-12 md:py-20 border-b border-gray-200 scroll-mt-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-gray-200 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
                {sections.home.newsEyebrow}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mt-1 break-words">
                {sections.home.newsTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {sections.home.newsDescription}
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
            >
              <span>{sections.home.newsCta}</span>
              <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
            </Link>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm font-medium text-gray-500">
              Memuat berita terbaru...
            </p>
          ) : (
            <div className="space-y-8">
              {/* Featured Article */}
              {featuredArticle && (
                <article className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-gray-300 transition-colors motion-reduce:transition-none">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto bg-gray-100 overflow-hidden">
                      <ArticleImage
                        src={featuredArticle.coverImageUrl}
                        alt={featuredArticle.title}
                        containerClassName="w-full h-full min-h-[260px]"
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
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3 break-words">
                          {featuredArticle.slug ? (
                            <Link
                              to={`/blog/${featuredArticle.slug}`}
                              className="hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {featuredArticle.title}
                            </Link>
                          ) : (
                            <Link
                              to="/blog"
                              className="hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {featuredArticle.title}
                            </Link>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6 break-words line-clamp-3">
                          {featuredArticle.excerpt}
                        </p>
                      </div>
                      <div>
                        <Link
                          to={featuredArticle.slug ? `/blog/${featuredArticle.slug}` : "/blog"}
                          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
                        >
                          <span>{sections.home.readMore}</span>
                          <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Small Article Grid: 3 Columns */}
              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridArticles.map((item) => (
                    <article
                      key={item.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col"
                    >
                      <div className="h-48 bg-gray-100 overflow-hidden">
                        <ArticleImage
                          src={item.coverImageUrl}
                          alt={item.title}
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0 p-5 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5">
                            <span className="bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded">
                              {item.categoryName || "Umum"}
                            </span>
                            {item.publishedAt && (
                              <time dateTime={item.publishedAt}>
                                {formatDate(item.publishedAt)}
                              </time>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 break-words line-clamp-2">
                            <Link
                              to={item.slug ? `/blog/${item.slug}` : "/blog"}
                              className="hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 break-words">
                            {item.excerpt}
                          </p>
                        </div>
                        <Link
                          to={item.slug ? `/blog/${item.slug}` : "/blog"}
                          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
                        >
                          <span>{sections.home.readMoreShort}</span>
                          <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true"></i>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
