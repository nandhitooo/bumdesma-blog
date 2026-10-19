import { useEffect, useRef, useState } from "react";
import { formatDate } from "../lib/date";

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
    fetch("/api/gallery", { signal: controller.signal })
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

  // Selama lightbox terbuka: scroll halaman dikunci dan fokus pindah ke dialog.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Esc menutup, panah kiri/kanan berpindah foto.
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

  // Fokus kembali ke gambar pemicu saat lightbox ditutup.
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
    <main className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Dokumentasi
          </span>
          <h1 className="mt-2 mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Galeri BUMDESMA Podo Rukun
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
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
                  className="group block w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span className="block aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || "Foto kegiatan BUMDESMA"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </span>
                  {(item.caption || item.eventDate) && (
                    <span className="block p-4">
                      {item.caption && (
                        <span className="block text-sm font-semibold text-gray-900">
                          {item.caption}
                        </span>
                      )}
                      {item.eventDate && (
                        <time
                          dateTime={item.eventDate}
                          className="mt-1 block text-xs text-gray-500"
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
          <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-12 text-center">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau foto galeri"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl outline-none sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {activeItem.caption && (
                  <p className="font-bold text-gray-900">
                    {activeItem.caption}
                  </p>
                )}
                {activeItem.eventDate && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(activeItem.eventDate)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Tutup pratinjau"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>

            <div className="relative">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.caption || "Foto kegiatan BUMDESMA"}
                className="max-h-[70vh] w-full rounded-xl bg-gray-100 object-contain"
              />
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Foto sebelumnya"
                    className="absolute left-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <i
                      className="fa-solid fa-chevron-left"
                      aria-hidden="true"
                    ></i>
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Foto berikutnya"
                    className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <i
                      className="fa-solid fa-chevron-right"
                      aria-hidden="true"
                    ></i>
                  </button>
                </>
              )}
            </div>

            <p className="mt-3 text-center text-xs font-semibold text-gray-500">
              {activeIndex + 1} / {items.length}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;
