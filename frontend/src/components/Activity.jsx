import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ArticleImage from "./ArticleImage";
import { apiUrl } from "../lib/apiUrl";
import { useSiteContent } from "../lib/siteContent";
import kegiatan1 from "../assets/kegiatan/kegiatan1.jpg";
import kegiatan2 from "../assets/kegiatan/kegiatan2.jpg";
import kegiatan3 from "../assets/kegiatan/kegiatan3.jpg";
import kegiatan4 from "../assets/kegiatan/kegiatan4.jpg";
import kegiatan5 from "../assets/kegiatan/kegiatan5.jpg";
import kegiatan6 from "../assets/kegiatan/kegiatan6.jpg";
import kegiatan7 from "../assets/kegiatan/kegiatan7.jpg";
import kegiatan8 from "../assets/kegiatan/kegiatan8.jpg";
import kegiatan9 from "../assets/kegiatan/kegiatan9.jpg";
import kegiatan10 from "../assets/kegiatan/kegiatan10.jpg";
import kegiatan11 from "../assets/kegiatan/kegiatan11.jpg";
import kegiatan12 from "../assets/kegiatan/kegiatan12.jpg";

// Dipakai hanya saat belum ada artikel maupun foto galeri di panel admin.
const staticItems = [
  { img: kegiatan1, text: "Evaluasi Kinerja Bumdesma tahun 2023" },
  { img: kegiatan2, text: "Bazar Produk Desa" },
  { img: kegiatan3, text: "Dolan bareng kelembagaan BUMDESMA" },
  { img: kegiatan4, text: "Muasyawarah Antar Desa (MAD)" },
  { img: kegiatan5, text: "Penyaluran bantuan sosial" },
  { img: kegiatan6, text: "Pembinaan kelompok SPP/UEP" },
  { img: kegiatan7, text: "Rapat koordinasi" },
  { img: kegiatan8, text: "Launching PT LKM ARTHA TANJUNG MANDIRI" },
  { img: kegiatan9, text: "Bimtek aplikasi laporan keuangan" },
  { img: kegiatan10, text: "Rapat koordinasi" },
  { img: kegiatan11, text: "Gerak jalan agustusan" },
  { img: kegiatan12, text: "Pelatihan" },
];

const Activity = () => {
  const { sections } = useSiteContent();
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const controller = new AbortController();

    const loadArticles = fetch(apiUrl("/api/articles?limit=6&page=1"), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat artikel kegiatan.");
        return response.json();
      })
      .then((data) =>
        Array.isArray(data.articles) && data.articles.length > 0
          ? data.articles
          : null,
      )
      .catch((error) => {
        if (error.name === "AbortError") return null;
        return null;
      });

    // Foto kegiatan wajib berasal dari galeri admin; galeri kosong berarti
    // fallback statis di bawah yang dipakai.
    const loadGallery = fetch(apiUrl("/api/gallery"), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat galeri.");
        return response.json();
      })
      .then((data) => (Array.isArray(data.items) ? data.items : []))
      .catch((error) => {
        if (error.name === "AbortError") return [];
        return [];
      });

    Promise.all([loadArticles, loadGallery]).then(([articleRows, galleryRows]) => {
      if (controller.signal.aborted) return;
      setArticles(articleRows);
      setGallery(galleryRows);
      setHasLoaded(true);
    });

    return () => controller.abort();
  }, []);

  const usingArticles = hasLoaded && articles !== null && articles.length > 0;
  const galleryCategory = sections.activity.galleryCategory;

  const fallbackItems = gallery.length
    ? gallery.map((item) => ({
        key: `galeri-${item.id}`,
        image: item.imageUrl,
        title: item.caption || galleryCategory,
        category: galleryCategory,
        to: "/galeri",
      }))
    : staticItems.map((item, index) => ({
        key: `statis-${index}`,
        image: item.img,
        title: item.text,
        category: sections.activity.eyebrow,
        to: "/blog",
      }));

  const totalPages = usingArticles
    ? 1
    : Math.ceil(fallbackItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = usingArticles
    ? articles
    : fallbackItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="py-12 md:py-20 bg-gray-50 border-b border-gray-200 scroll-mt-18" id="activity">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-gray-200 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
              {sections.activity.eyebrow}
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mt-1 mb-2 break-words">
              {sections.activity.title}
            </h2>
            <p className="text-base text-gray-600">
              {sections.activity.description}
            </p>
          </div>
          <Link
            to="/galeri"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors motion-reduce:transition-none"
          >
            <span>{sections.activity.cta}</span>
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
          </Link>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => {
            const isArticle = usingArticles;
            const image = isArticle ? item.coverImageUrl : item.image;
            const title = item.title;
            const category = isArticle
              ? item.categoryName || "Berita"
              : item.category;
            const targetLink = isArticle
              ? item.slug
                ? `/blog/${item.slug}`
                : "/blog"
              : item.to;

            return (
              <article
                key={isArticle ? item.id : item.key}
                className="group bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col"
              >
                <Link to={targetLink} className="flex-1 flex flex-col">
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <ArticleImage
                      src={image}
                      alt={title}
                      containerClassName="w-full h-full"
                      className="transition-opacity motion-reduce:transition-none duration-300 group-hover:opacity-90"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-white text-brand-primary text-xs font-semibold px-2.5 py-1 rounded shadow-sm border border-gray-200">
                        {category}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-primary transition-colors motion-reduce:transition-none leading-snug break-words">
                      {title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                      <span>{sections.activity.detailLabel}</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true"></i>
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* Fallback Pagination */}
        {!usingArticles && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors motion-reduce:transition-none cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="px-3 text-xs font-semibold text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors motion-reduce:transition-none cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Activity;
