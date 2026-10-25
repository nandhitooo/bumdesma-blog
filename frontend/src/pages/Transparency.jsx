import { useEffect, useState } from "react";

// Dokumen laporan hanya berupa tautan ke penyimpanan eksternal (mis. Google
// Drive); tidak ada berkas yang diunggah atau disajikan dari server ini.
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
    fetch("/api/documents", { signal: controller.signal })
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
    <main className="min-h-dvh bg-gray-50 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Keterbukaan Informasi
          </span>
          <h1 className="mt-2 mb-3 text-2xl font-bold tracking-tight text-gray-900 break-words sm:text-3xl lg:text-4xl">
            Transparansi Dokumen Laporan
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Laporan pertanggungjawaban dan dokumen resmi BUMDESMA Podo Rukun LKD
            per tahun, disajikan dalam bentuk tautan dokumen.
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
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.year} aria-labelledby={`tahun-${group.year}`}>
                <h2
                  id={`tahun-${group.year}`}
                  className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl"
                >
                  <i
                    className="fa-regular fa-folder-open text-brand-primary"
                    aria-hidden="true"
                  ></i>
                  Tahun {group.year}
                </h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {group.documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex h-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-5"
                    >
                      <h3 className="text-base font-bold text-gray-900 break-words">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="mt-2 flex-1 break-words text-sm text-gray-600">
                          {document.description}
                        </p>
                      )}
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      >
                        Buka dokumen
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
          <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-12">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada dokumen.
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
