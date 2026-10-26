import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../lib/apiUrl";
import { useSiteContent } from "../lib/siteContent";
import { usePageTitle } from "../lib/usePageTitle";

function Faq() {
  const { sections } = useSiteContent();
  usePageTitle("FAQ");
  const [faqs, setFaqs] = useState([]);
  const [openIds, setOpenIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/faqs"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat FAQ.");
        return response.json();
      })
      .then((data) => {
        setFaqs(data.faqs);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat FAQ:", fetchError);
        setError("Daftar FAQ belum dapat dimuat. Coba muat ulang halaman.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const toggle = (id) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">FAQ</span>
        </nav>

        {/* Uniform Header */}
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            {sections.faq.eyebrow}
          </span>
          <h1 className="mt-1 mb-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
            {sections.faq.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {sections.faq.description}
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
            Memuat FAQ...
          </p>
        ) : faqs.length ? (
          <ul className="space-y-4">
            {faqs.map((faq) => {
              const panelId = `faq-panel-${faq.id}`;
              const buttonId = `faq-button-${faq.id}`;
              const isOpen = openIds.has(faq.id);

              return (
                <li
                  key={faq.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:border-gray-300"
                >
                  <h2>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(faq.id)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-gray-900 transition-colors motion-reduce:transition-none hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset sm:px-6"
                    >
                      <span className="break-words leading-snug">{faq.question}</span>
                      <i
                        className={`fa-solid ${
                          isOpen ? "fa-minus" : "fa-plus"
                        } shrink-0 text-xs text-brand-primary`}
                        aria-hidden="true"
                      ></i>
                    </button>
                  </h2>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 text-sm leading-relaxed text-gray-600 sm:px-6 sm:py-5"
                  >
                    <p className="whitespace-pre-line break-words">{faq.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              {sections.faq.emptyTitle}
            </h2>
            <p className="text-sm text-gray-600">
              {sections.faq.emptyText}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Faq;
