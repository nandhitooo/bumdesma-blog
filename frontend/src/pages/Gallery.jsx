import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/date";
import { apiUrl } from "../lib/apiUrl";

function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const triggers = useRef([]);

  useEffect(() => {
    document.title = "Galeri | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/gallery"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat galeri.");
        return response.json();
      })
      .then((data) => {
        setItems(data.items);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat galeri:", fetchError);
        setError("Galeri belum dapat dimuat. Coba muat ulang halaman.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const isOpen = activeIndex !== null;
  const activeItem = isOpen ? items[activeIndex] : null;

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index - 1 + items.length) % items.length);
      } else if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index + 1) % items.length);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return undefined;
    return () => openerRef.current?.focus();
  }, [isOpen]);

  const openLightbox = (index) => {
    openerRef.current = triggers.current[index] ?? null;
    setActiveIndex(index);
  };

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + items.length) % items.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % items.length);
  };

  return (
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Galeri</span>
        </nav>

        {/* Uniform Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Dokumentasi
          </span>
          <h1 className="mt-1 mb-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
            Galeri BUMDESMA Podo Rukun
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Foto kegiatan, pembinaan, dan kebersamaan BUMDESMA Podo Rukun LKD
            Kecamatan Wilangan.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-20 text-center text-sm font-medium text-gray-500">
            Memuat galeri...
          </p>
        ) : items.length ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  ref={(node) => {
                    triggers.current[index] = node;
                  }}
                  type="button"
                  onClick={() => openLightbox(index)}
                  aria-label={
                    item.caption
                      ? `Buka foto: ${item.caption}`
                      : "Buka foto galeri"
                  }
                  className="group block w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition-colors motion-reduce:transition-none hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span className="block aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || "Foto kegiatan BUMDESMA"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform motion-reduce:transition-none duration-300 motion-reduce:transform-none group-hover:scale-[1.02]"
                    />
                  </span>
                  {(item.caption || item.eventDate) && (
                    <span className="block p-5">
                      {item.caption && (
                        <span className="block break-words text-sm font-bold text-gray-900 leading-snug">
                          {item.caption}
                        </span>
                      )}
                      {item.eventDate && (
                        <time
                          dateTime={item.eventDate}
                          className="mt-1.5 block text-xs text-gray-500"
                        >
                          {formatDate(item.eventDate)}
                        </time>
                      )}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada foto
            </h2>
            <p className="text-sm text-gray-600">
              Foto kegiatan akan tampil di sini setelah ditambahkan melalui
              panel admin.
            </p>
          </div>
        )}
      </div>

      {isOpen && activeItem && (
        <div
          className="fixed inset-0 z-50 flex max-h-dvh items-center justify-center overflow-y-auto bg-black/80 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau foto galeri"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-dvh w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:p-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {activeItem.caption && (
                  <p className="break-words font-bold text-gray-900 text-base sm:text-lg">
                    {activeItem.caption}
                  </p>
                )}
                {activeItem.eventDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(activeItem.eventDate)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Tutup pratinjau"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition motion-reduce:transition-none hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <i className="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
              </button>
            </div>

            <div className="relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.caption || "Foto kegiatan BUMDESMA"}
                decoding="async"
                className="mx-auto max-h-[75dvh] max-w-full object-contain"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Foto sebelumnya"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm transition motion-reduce:transition-none hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true"></i>
                </button>
              )}
              <p className="text-xs font-semibold text-gray-600 px-3">
                {activeIndex + 1} / {items.length}
              </p>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Foto berikutnya"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm transition motion-reduce:transition-none hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;
