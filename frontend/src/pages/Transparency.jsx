import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../lib/apiUrl";

function groupByYear(documents) {
  const groups = [];
  for (const document of documents) {
    const last = groups[groups.length - 1];
    if (last && last.year === document.year) {
      last.documents.push(document);
    } else {
      groups.push({ year: document.year, documents: [document] });
    }
  }
  return groups;
}

function Transparency() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Transparansi | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/documents"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat dokumen.");
        return response.json();
      })
      .then((data) => {
        setDocuments(data.documents);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat dokumen:", fetchError);
        setError("Dokumen belum dapat dimuat. Coba muat ulang halaman.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const groups = groupByYear(documents);

  return (
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Transparansi</span>
        </nav>

        {/* Uniform Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Keterbukaan Informasi
          </span>
          <h1 className="mt-1 mb-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
            Transparansi Dokumen Laporan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Laporan pertanggungjawaban dan dokumen resmi BUMDESMA Podo Rukun LKD
            per tahun, disajikan dalam bentuk tautan dokumen resmi.
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
            Memuat dokumen...
          </p>
        ) : groups.length ? (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.year} aria-labelledby={`tahun-${group.year}`}>
                <h2
                  id={`tahun-${group.year}`}
                  className="mb-6 flex items-center gap-2.5 text-xl font-bold text-gray-900 border-b border-gray-200 pb-3"
                >
                  <i
                    className="fa-regular fa-folder-open text-brand-primary text-lg"
                    aria-hidden="true"
                  ></i>
                  <span>Tahun {group.year}</span>
                </h2>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex h-full min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300 transition-colors"
                    >
                      <h3 className="text-base font-bold text-gray-900 break-words">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="mt-2.5 flex-1 break-words text-sm text-gray-600 leading-relaxed">
                          {document.description}
                        </p>
                      )}
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      >
                        <span>Buka dokumen</span>
                        <i
                          className="fa-solid fa-arrow-up-right-from-square text-xs"
                          aria-hidden="true"
                        ></i>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada dokumen
            </h2>
            <p className="text-sm text-gray-600">
              Dokumen laporan akan tampil di sini setelah ditambahkan melalui
              panel admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Transparency;
