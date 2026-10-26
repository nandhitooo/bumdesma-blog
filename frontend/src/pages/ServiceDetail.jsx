import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSiteContent } from "../lib/siteContent";
import { safeWaLink } from "../lib/siteContentUtils";
import { apiUrl } from "../lib/apiUrl";

function ServiceDetail() {
  const { slug } = useParams();
  const { contact } = useSiteContent();
  const [result, setResult] = useState(null);
  const loading = result?.slug !== slug;
  const service = result?.slug === slug ? result.service : null;
  const error = result?.slug === slug ? result.error : "";
  const notFound = result?.slug === slug && !result.service;

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
        document.title = `${data.title} | BUMDESMA Podo Rukun LKD`;
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setResult({ slug, service: null, error: fetchError.message });
          document.title = "Layanan tidak ditemukan | BUMDESMA Podo Rukun LKD";
        }
      });

    return () => {
      controller.abort();
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, [slug]);

  const whatsappLink = safeWaLink(contact.whatsapp);
  const requirements = Array.isArray(service?.requirements)
    ? service.requirements
    : [];
  const steps = Array.isArray(service?.steps) ? service.steps : [];

  return (
    <main className="min-h-dvh bg-white py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6">
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 break-words sm:text-3xl lg:text-4xl">
              {service.title}
            </h1>
            {service.summary && (
              <p className="mt-3 break-words text-sm leading-relaxed text-gray-600 sm:text-base">
                {service.summary}
              </p>
            )}

            <section className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Syarat
              </h2>
              {requirements.length ? (
                <ul className="mt-4 space-y-2">
                  {requirements.map((requirement, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm leading-relaxed text-gray-700 sm:text-base"
                    >
                      <i
                        className="fa-solid fa-circle-check mt-1 text-xs text-brand-primary"
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
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Alur Pengajuan
              </h2>
              {steps.length ? (
                <ol className="mt-4 space-y-3">
                  {steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm leading-relaxed text-gray-700 sm:text-base"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-primary">
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
              <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-sm text-gray-700">
                  Ada pertanyaan tentang layanan ini? Hubungi petugas BUMDESMA
                  melalui WhatsApp.
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>
            )}
          </article>
        ) : (
          <div className="rounded-xl border border-gray-200 p-10 text-center">
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
              className="inline-flex min-h-[44px] items-center justify-center bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors motion-reduce:transition-none hover:bg-brand-dark"
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
