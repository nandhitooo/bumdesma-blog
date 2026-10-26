import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../lib/apiUrl";

function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Layanan | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/service-details"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat layanan.");
        return response.json();
      })
      .then((data) => {
        setServices(data.services);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat layanan:", fetchError);
        setError("Daftar layanan belum dapat dimuat. Coba muat ulang halaman.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Layanan</span>
        </nav>

        {/* Uniform Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Unit Usaha
          </span>
          <h1 className="mt-1 mb-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
            Layanan BUMDESMA Podo Rukun
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Ringkasan tiap unit usaha beserta syarat dan alur pengajuan yang
            perlu disiapkan masyarakat.
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
            Memuat layanan...
          </p>
        ) : services.length ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-6 sm:p-7 shadow-sm transition-colors motion-reduce:transition-none hover:border-gray-300 justify-between"
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-900 break-words mb-2">
                    {service.title}
                  </h2>
                  <p className="break-words text-sm leading-relaxed text-gray-600 line-clamp-3">
                    {service.summary || "Belum ada ringkasan."}
                  </p>
                </div>
                <Link
                  to={`/layanan/${service.slug}`}
                  className="mt-6 inline-flex w-fit min-h-[44px] items-center gap-2 rounded-lg text-sm font-semibold text-brand-primary transition-colors motion-reduce:transition-none hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span>Lihat syarat dan alur pengajuan</span>
                  <i
                    className="fa-solid fa-arrow-right text-xs"
                    aria-hidden="true"
                  ></i>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada layanan
            </h2>
            <p className="text-sm text-gray-600">
              Detail layanan akan tampil di sini setelah ditambahkan melalui
              panel admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default ServiceList;
