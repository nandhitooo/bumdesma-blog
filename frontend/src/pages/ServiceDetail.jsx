import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSiteContent } from "../lib/siteContent";
import { safeWaLink } from "../lib/siteContentUtils";
import { apiUrl } from "../lib/apiUrl";
import { usePageTitle } from "../lib/usePageTitle";

function ServiceDetail() {
  const { slug } = useParams();
  const { contact } = useSiteContent();
  const [result, setResult] = useState(null);
  const loading = result?.slug !== slug;
  const service = result?.slug === slug ? result.service : null;
  const error = result?.slug === slug ? result.error : "";
  const notFound = result?.slug === slug && !result.service;
  usePageTitle(
    service
      ? service.title
      : result?.slug === slug
        ? "Layanan tidak ditemukan"
        : "Layanan",
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/service-details/${encodeURIComponent(slug)}`), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Layanan tidak ditemukan.");
        }
        return data.service;
      })
      .then((data) => {
        setResult({ slug, service: data, error: "" });
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setResult({ slug, service: null, error: fetchError.message });
        }
      });

    return () => controller.abort();
  }, [slug]);

  const whatsappLink = safeWaLink(contact.whatsapp);
  const requirements = Array.isArray(service?.requirements)
    ? service.requirements
    : [];
  const steps = Array.isArray(service?.steps) ? service.steps : [];

  return (
    <main className="min-h-dvh bg-white py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <Link to="/layanan" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Layanan
          </Link>
          {service?.title && (
            <>
              <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
              <span className="truncate max-w-[200px] sm:max-w-xs text-gray-900 font-medium">
                {service.title}
              </span>
            </>
          )}
        </nav>

        <div className="mb-6">
          <Link
            to="/layanan"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary transition-colors motion-reduce:transition-none hover:text-brand-dark"
          >
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
            <span>Kembali ke Daftar Layanan</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            Memuat layanan...
          </div>
        ) : service ? (
          <article>
            <div className="mb-8 border-b border-gray-200 pb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Unit Usaha
              </span>
              <h1 className="mt-1 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
                {service.title}
              </h1>
              {service.summary && (
                <p className="mt-3 break-words text-base leading-relaxed text-gray-600 sm:text-lg">
                  {service.summary}
                </p>
              )}
            </div>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">
                Syarat &amp; Ketentuan
              </h2>
              {requirements.length ? (
                <ul className="mt-4 space-y-3">
                  {requirements.map((requirement, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 sm:text-base shadow-sm"
                    >
                      <i
                        className="fa-solid fa-circle-check mt-1 text-sm text-brand-primary shrink-0"
                        aria-hidden="true"
                      ></i>
                      <span className="min-w-0 break-words">{requirement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Belum ada syarat yang dicatat.
                </p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-gray-900">
                Alur &amp; Prosedur Pengajuan
              </h2>
              {steps.length ? (
                <ol className="mt-4 space-y-3">
                  {steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3.5 rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 sm:text-base shadow-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-primary mt-0.5">
                        {index + 1}
                      </span>
                      <span className="min-w-0 break-words">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Belum ada alur pengajuan yang dicatat.
                </p>
              )}
            </section>

            {whatsappLink && (
              <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Butuh Konsultasi Lebih Lanjut?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  Ada pertanyaan seputar persyaratan atau ingin simulasi pinjaman? Hubungi petugas BUMDESMA melalui WhatsApp resmi kami.
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <i className="fa-brands fa-whatsapp text-base" aria-hidden="true"></i>
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>
            )}
          </article>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 sm:p-12 text-center shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 break-words">
              Layanan tidak ditemukan
            </h1>
            <p role="alert" className="mb-6 break-words text-sm text-gray-600">
              {notFound && !error
                ? "Layanan ini tidak tersedia."
                : error || "Layanan ini tidak tersedia."}
            </p>
            <Link
              to="/layanan"
              className="inline-flex min-h-[44px] items-center justify-center bg-brand-primary px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-colors motion-reduce:transition-none hover:bg-brand-dark"
            >
              Kembali ke Daftar Layanan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default ServiceDetail;
