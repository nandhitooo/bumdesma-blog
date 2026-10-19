import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ArticleImage from "./ArticleImage";
import { useSiteContent } from "../lib/siteContent";
import { isValidIcon } from "../lib/siteContentUtils";
import { formatDate } from "../lib/date";
import kegiatan1 from "../assets/kegiatan/kegiatan1.jpg";
import kegiatan2 from "../assets/kegiatan/kegiatan2.jpg";
import kegiatan8 from "../assets/kegiatan/kegiatan8.jpg";

const defaultHighlights = [
  {
    id: "fb-1",
    title: "Launching PT LKM ARTHA TANJUNG MANDIRI",
    categoryName: "Bisnis",
    coverImageUrl: kegiatan8,
    excerpt: "Langkah strategis pengembangan layanan keuangan mikro desa untuk mendukung permodalan dan penguatan usaha warga.",
    // Tanpa publishedAt: kartu ini bukan berita sungguhan, jadi tidak boleh
    // menampilkan tanggal seolah-olah artikel terbit pada tanggal tersebut.
    slug: "",
  },
  {
    id: "fb-2",
    title: "Evaluasi Kinerja Tahunan BUMDESMA Podo Rukun",
    categoryName: "Internal",
    coverImageUrl: kegiatan1,
    excerpt: "Pertanggungjawaban pengelolaan unit usaha desa dan perencanaan program kerja berkelanjutan.",
    slug: "",
  },
  {
    id: "fb-3",
    title: "Bazar Produk Desa & Pemberdayaan Ekonomi Warga",
    categoryName: "Event",
    coverImageUrl: kegiatan2,
    excerpt: "Mendorong promosi produk unggulan masyarakat desa Wilangan agar memiliki daya saing lebih luas.",
    slug: "",
  },
];

const Home = () => {
  const { hero } = useSiteContent();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/articles?limit=4", { signal: controller.signal })
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
      {/* Hero Section */}
      <section className="bg-white py-10 sm:py-14 lg:py-16 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold tracking-wider text-brand-primary uppercase mb-4">
              {hero.subtitle}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-6 break-words">
              {hero.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
              {hero.description}
            </p>
            <div>
              <a
                href="#berita-terbaru"
                className="inline-flex min-h-[44px] items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white text-sm sm:text-base font-medium px-6 py-3 rounded-lg transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <span>{hero.buttonLabel || "Lihat Berita Terbaru"}</span>
                <i className="fa-solid fa-arrow-down text-xs" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          {/* Hero Highlights */}
          {Array.isArray(hero.highlights) && hero.highlights.length > 0 && (
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-10 border-t border-gray-100">
              {hero.highlights.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-5 sm:p-6 rounded-xl border border-gray-200 flex flex-col justify-between"
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
          )}
        </div>
      </section>

      {/* Berita Terbaru Section */}
      <section id="berita-terbaru" className="bg-gray-50 py-10 sm:py-14 lg:py-16 scroll-mt-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight break-words">
                Berita Terbaru
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Kabar, pengumuman, dan cerita terkini seputar kegiatan BUMDESMA.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
            >
              <span>Lihat Semua Blog</span>
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
                <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors motion-reduce:transition-none">
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
                              className="inline-flex min-h-[44px] items-center hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {featuredArticle.title}
                            </Link>
                          ) : (
                            <Link
                              to="/blog"
                              className="inline-flex min-h-[44px] items-center hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {featuredArticle.title}
                            </Link>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6 break-words">
                          {featuredArticle.excerpt}
                        </p>
                      </div>
                      <div>
                        <Link
                          to={featuredArticle.slug ? `/blog/${featuredArticle.slug}` : "/blog"}
                          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
                        >
                          <span>Baca artikel lengkap</span>
                          <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Small Article Grid (At most 3 columns) */}
              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {gridArticles.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col"
                    >
                      <div className="h-44 bg-gray-100 overflow-hidden">
                        <ArticleImage
                          src={item.coverImageUrl}
                          alt={item.title}
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0 p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span className="bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded">
                              {item.categoryName || "Umum"}
                            </span>
                            {item.publishedAt && (
                              <time dateTime={item.publishedAt}>
                                {formatDate(item.publishedAt)}
                              </time>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-gray-900 leading-snug mb-2 break-words">
                            <Link
                              to={item.slug ? `/blog/${item.slug}` : "/blog"}
                              className="inline-flex min-h-[44px] items-center hover:text-brand-primary transition-colors motion-reduce:transition-none"
                            >
                              {item.title}
                            </Link>
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 break-words">
                            {item.excerpt}
                          </p>
                        </div>
                        <Link
                          to={item.slug ? `/blog/${item.slug}` : "/blog"}
                          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
                        >
                          <span>Baca selengkapnya</span>
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
