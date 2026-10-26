import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ArticleImage from "./ArticleImage";
import { apiUrl } from "../lib/apiUrl";
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

const fallbackItems = [
  {
    img: kegiatan1,
    text: "Evaluasi Kinerja Bumdesma tahun 2023",
    category: "Internal",
  },
  { img: kegiatan2, text: "Bazar Produk Desa", category: "Event" },
  {
    img: kegiatan3,
    text: "Dolan bareng kelembagaan BUMDESMA",
    category: "Gathering",
  },
  {
    img: kegiatan4,
    text: "Muasyawarah Antar Desa (MAD)",
    category: "Internal",
  },
  { img: kegiatan5, text: "Penyaluran bantuan sosial", category: "Sosial" },
  { img: kegiatan6, text: "Pembinaan kelompok SPP/UEP", category: "Edukasi" },
  { img: kegiatan7, text: "Rapat koordinasi", category: "Internal" },
  {
    img: kegiatan8,
    text: "Launching PT LKM ARTHA TANJUNG MANDIRI",
    category: "Bisnis",
  },
  {
    img: kegiatan9,
    text: "Bimtek aplikasi laporan keuangan",
    category: "Edukasi",
  },
  { img: kegiatan10, text: "Rapat koordinasi", category: "Internal" },
  { img: kegiatan11, text: "Gerak jalan agustusan", category: "Event" },
  { img: kegiatan12, text: "Pelatihan", category: "Edukasi" },
];

const Activity = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/articles?limit=6&page=1"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat artikel kegiatan.");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.articles) || data.articles.length === 0) {
          setArticles(null);
        } else {
          setArticles(data.articles);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setArticles(null);
        }
      })
      .finally(() => setHasLoaded(true));

    return () => controller.abort();
  }, []);

  const usingArticles = hasLoaded && articles !== null && articles.length > 0;
  const totalPages = usingArticles
    ? 1
    : Math.ceil(fallbackItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = usingArticles
    ? articles
    : fallbackItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-white scroll-mt-18" id="activity">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Dokumentasi
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3 break-words">
            Kegiatan Terbaru
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Dokumentasi berbagai program dan kegiatan operasional BUMDESMA dalam memajukan ekonomi desa.
          </p>
        </div>

        {/* Max 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentItems.map((item, index) => {
            const isArticle = usingArticles;
            const image = isArticle ? item.coverImageUrl : item.img;
            const title = isArticle ? item.title : item.text;
            const category = isArticle ? item.categoryName || "Berita" : item.category;
            const targetLink = isArticle && item.slug ? `/blog/${item.slug}` : "/blog";

            return (
              <article
                key={isArticle ? item.id : `${item.text}-${index}`}
                className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col"
              >
                <Link to={targetLink} className="flex-1 flex flex-col">
                  <div className="relative h-52 bg-gray-100 overflow-hidden">
                    <ArticleImage
                      src={image}
                      alt={title}
                      containerClassName="w-full h-full"
                      className="transition-opacity motion-reduce:transition-none duration-300 group-hover:opacity-90"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-white/95 text-brand-primary text-xs font-semibold px-2.5 py-1 rounded border border-gray-200">
                        {category}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 p-5 flex-1 flex flex-col justify-between">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-primary transition-colors motion-reduce:transition-none leading-snug break-words">
                      {title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                      <span>Lihat detail</span>
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
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors motion-reduce:transition-none cursor-pointer"
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
              className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors motion-reduce:transition-none cursor-pointer"
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
