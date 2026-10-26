import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArticleImage from "../components/ArticleImage";
import { apiUrl } from "../lib/apiUrl";
import { useSiteContent } from "../lib/siteContent";
import { usePageTitle } from "../lib/usePageTitle";

function Team() {
  const { sections } = useSiteContent();
  usePageTitle("Pengurus");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/team"), { signal: controller.signal })
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
    <main className="min-h-dvh bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-primary transition-colors motion-reduce:transition-none">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-gray-400" aria-hidden="true"></i>
          <span className="text-gray-900 font-medium">Pengurus</span>
        </nav>

        {/* Uniform Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            {sections.team.eyebrow}
          </span>
          <h1 className="mt-1 mb-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900 break-words">
            {sections.team.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {sections.team.description}
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
                className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors"
              >
                <ArticleImage
                  src={member.photoUrl}
                  alt={member.photoUrl ? `Foto ${member.name}` : ""}
                  aspectRatio="aspect-[4/5]"
                />
                <div className="min-w-0 p-5 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-brand-primary break-words">
                    {member.position}
                  </p>
                  {member.termLabel && (
                    <p className="mt-1.5 text-xs text-gray-500 break-words">
                      Masa bakti {member.termLabel}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              {sections.team.emptyTitle}
            </h2>
            <p className="text-sm text-gray-600">
              {sections.team.emptyText}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Team;
