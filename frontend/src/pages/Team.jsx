import { useEffect, useState } from "react";
import ArticleImage from "../components/ArticleImage";

function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Pengurus | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/team", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat pengurus.");
        return response.json();
      })
      .then((data) => {
        setMembers(data.members);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        console.error("Gagal memuat pengurus:", fetchError);
        setError("Susunan pengurus belum dapat dimuat. Coba muat ulang halaman.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Struktur Organisasi
          </span>
          <h1 className="mt-2 mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Pengurus BUMDESMA Podo Rukun
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Susunan pengurus BUMDESMA Podo Rukun LKD Kecamatan Wilangan beserta
            jabatan dan masa bakti.
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
            Memuat pengurus...
          </p>
        ) : members.length ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <ArticleImage
                  src={member.photoUrl}
                  alt={member.photoUrl ? `Foto ${member.name}` : ""}
                  aspectRatio="aspect-[4/5]"
                />
                <div className="p-5">
                  <h2 className="text-base font-bold text-gray-900">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-brand-primary">
                    {member.position}
                  </p>
                  {member.termLabel && (
                    <p className="mt-1 text-xs text-gray-500">
                      Masa bakti {member.termLabel}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-12 text-center">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Belum ada data pengurus
            </h2>
            <p className="text-sm text-gray-600">
              Susunan pengurus akan tampil di sini setelah ditambahkan melalui
              panel admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Team;
