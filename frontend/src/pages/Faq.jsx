import { useEffect, useState } from "react";

function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [openIds, setOpenIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "FAQ | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/faqs", { signal: controller.signal })
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

  // Beberapa jawaban boleh terbuka sekaligus, jadi statusnya disimpan sebagai
  // himpunan id, bukan satu id aktif.
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
    <main className="min-h-dvh bg-gray-50 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Bantuan
          </span>
          <h1 className="mt-2 mb-3 text-2xl font-bold tracking-tight text-gray-900 break-words sm:text-3xl lg:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Jawaban singkat atas pertanyaan umum seputar layanan BUMDESMA Podo
            Rukun LKD.
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
          <ul className="space-y-3">
            {faqs.map((faq) => {
              const panelId = `faq-panel-${faq.id}`;
              const buttonId = `faq-button-${faq.id}`;
              const isOpen = openIds.has(faq.id);

              return (
                <li
                  key={faq.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <h2>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(faq.id)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-gray-900 transition-colors motion-reduce:transition-none hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset sm:px-6 sm:text-base"
                    >
                      <span className="break-words">{faq.question}</span>
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
                    className="px-5 pb-5 text-sm leading-relaxed text-gray-600 sm:px-6 sm:pb-6"
                  >
                    <p className="whitespace-pre-line break-words">{faq.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-12">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada FAQ
            </h2>
            <p className="text-sm text-gray-600">
              Pertanyaan umum akan tampil di sini setelah ditambahkan melalui
              panel admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Faq;
