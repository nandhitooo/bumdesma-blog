import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
    publishedAt: "2024-08-30",
    slug: "",
  },
  {
    id: "fb-2",
    title: "Evaluasi Kinerja Tahunan BUMDESMA Podo Rukun",
    categoryName: "Internal",
    coverImageUrl: kegiatan1,
    excerpt: "Pertanggungjawaban pengelolaan unit usaha desa dan perencanaan program kerja berkelanjutan.",
    publishedAt: "2024-01-15",
    slug: "",
  },
  {
    id: "fb-3",
    title: "Bazar Produk Desa & Pemberdayaan Ekonomi Warga",
    categoryName: "Event",
    coverImageUrl: kegiatan2,
    excerpt: "Mendorong promosi produk unggulan masyarakat desa Wilangan agar memiliki daya saing lebih luas.",
    publishedAt: "2024-05-20",
    slug: "",
  },
];

const Home = () => {
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
    <div id="home">
      {/* Hero Section */}
      <section className="bg-white py-16 sm:py-24 lg:py-28 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold tracking-wider text-brand-primary uppercase mb-4">
              BUMDESMA Podo Rukun LKD • Wilangan, Nganjuk
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
              Penggerak Ekonomi & Kemandirian Desa Wilangan
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
              BUMDESMA Podo Rukun LKD berperan sebagai penggerak ekonomi desa melalui pengelolaan usaha bersama secara profesional, transparan, dan inovatif demi kesejahteraan masyarakat.
            </p>
            <div>
              <a
                href="#berita-terbaru"
                className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white text-sm sm:text-base font-medium px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                <span>Lihat Berita Terbaru</span>
                <i className="fa-solid fa-arrow-down text-xs" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Berita Terbaru Section */}
      <section id="berita-terbaru" className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Berita Terbaru
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Kabar, pengumuman, dan cerita terkini seputar kegiatan BUMDESMA.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
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
                <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto bg-gray-100 overflow-hidden">
                      <img
                        src={featuredArticle.coverImageUrl}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
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
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
                          {featuredArticle.slug ? (
                            <Link
                              to={`/blog/${featuredArticle.slug}`}
                              className="hover:text-brand-primary transition-colors"
                            >
                              {featuredArticle.title}
                            </Link>
                          ) : (
                            <Link
                              to="/blog"
                              className="hover:text-brand-primary transition-colors"
                            >
                              {featuredArticle.title}
                            </Link>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          {featuredArticle.excerpt}
                        </p>
                      </div>
                      <div>
                        <Link
                          to={featuredArticle.slug ? `/blog/${featuredArticle.slug}` : "/blog"}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridArticles.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors flex flex-col"
                    >
                      <div className="h-44 bg-gray-100 overflow-hidden">
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
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
                          <h4 className="text-base font-bold text-gray-900 leading-snug mb-2">
                            <Link
                              to={item.slug ? `/blog/${item.slug}` : "/blog"}
                              className="hover:text-brand-primary transition-colors"
                            >
                              {item.title}
                            </Link>
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                            {item.excerpt}
                          </p>
                        </div>
                        <Link
                          to={item.slug ? `/blog/${item.slug}` : "/blog"}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-dark transition-colors"
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
