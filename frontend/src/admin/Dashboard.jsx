import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";
import EmptyState from "./components/EmptyState";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PageHeader from "./components/PageHeader";
import StatusBadge from "./components/StatusBadge";

const quickActions = [
  { to: "/admin/articles/new", label: "Tulis artikel", icon: "plus" },
  { to: "/admin/content", label: "Ubah konten situs", icon: "sliders" },
  { to: "/admin/gallery", label: "Tambah foto", icon: "image" },
];

function StatCard({ label, value, icon, to }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <i className={`fa-solid fa-${icon} text-lg text-green-700`} aria-hidden="true"></i>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-gray-900">{value}</p>
    </>
  );

  return to ? (
    <Link
      to={to}
      className="rounded-3xl bg-white p-5 shadow-sm transition hover:bg-green-50 motion-reduce:transition-none sm:p-6"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">{content}</div>
  );
}

function isScheduled(article) {
  return (
    article.status === "published" &&
    Boolean(article.publishedAt) &&
    new Date(article.publishedAt).getTime() > Date.now()
  );
}

function AdminDashboard() {
  const { user } = useOutletContext();
  const isAdmin = user.role === "admin";
  const [articles, setArticles] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const requests = [
      adminApi("/api/admin/articles").then(({ articles: rows }) => ({ articles: rows })),
    ];
    // Ringkasan isi situs hanya untuk admin: endpoint-nya memang khusus admin,
    // jadi editor tidak boleh memicunya sama sekali.
    if (isAdmin) {
      requests.push(
        Promise.all([
          adminApi("/api/admin/gallery"),
          adminApi("/api/admin/documents"),
          adminApi("/api/admin/team"),
          adminApi("/api/admin/faqs"),
        ]).then(([gallery, documents, team, faqs]) => ({
          gallery: gallery.items.length,
          documents: documents.documents.length,
          team: team.members.length,
          faqs: faqs.faqs.length,
        })),
      );
    }

    Promise.all(requests)
      .then(([articleData, contentCounts]) => {
        if (!active) return;
        setArticles(articleData.articles);
        if (contentCounts) setCounts(contentCounts);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setArticles([]);
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const drafts = (articles || []).filter((article) => article.status === "draft").length;
  const published = (articles || []).filter(
    (article) => article.status === "published",
  ).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Panel pengelola"
        title={`Selamat datang, ${user.name}`}
        description={
          isAdmin
            ? "Ringkasan isi situs dan pintasan pekerjaan yang sering dipakai."
            : "Kelola artikel Anda, lalu admin akan menerbitkannya ke halaman blog."
        }
      >
        <Link
          to="/admin/articles/new"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800 motion-reduce:transition-none"
        >
          <i className="fa-solid fa-plus" aria-hidden="true"></i>
          Tulis artikel
        </Link>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {articles === null ? (
        <div className="rounded-3xl bg-white shadow-sm">
          <LoadingSkeleton rows={3} label="Memuat ringkasan..." />
        </div>
      ) : (
        <>
          <section aria-label="Ringkasan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin ? (
              <>
                <StatCard
                  label="Artikel"
                  value={articles.length}
                  icon="newspaper"
                  to="/admin/articles"
                />
                <StatCard label="Draf artikel" value={drafts} icon="file-lines" />
                <StatCard
                  label="Foto galeri"
                  value={counts ? counts.gallery : "—"}
                  icon="images"
                  to="/admin/gallery"
                />
                <StatCard
                  label="Dokumen laporan"
                  value={counts ? counts.documents : "—"}
                  icon="file-shield"
                  to="/admin/documents"
                />
                <StatCard
                  label="Pengurus"
                  value={counts ? counts.team : "—"}
                  icon="people-group"
                  to="/admin/team"
                />
                <StatCard
                  label="FAQ"
                  value={counts ? counts.faqs : "—"}
                  icon="circle-question"
                  to="/admin/faqs"
                />
              </>
            ) : (
              <>
                <StatCard label="Artikel saya" value={articles.length} icon="newspaper" to="/admin/articles" />
                <StatCard label="Draf" value={drafts} icon="file-lines" />
                <StatCard label="Sudah terbit" value={published} icon="circle-check" />
              </>
            )}
          </section>

          {isAdmin && (
            <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Aksi cepat</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-green-50 motion-reduce:transition-none"
                  >
                    <i className={`fa-solid fa-${action.icon} text-green-700`} aria-hidden="true"></i>
                    <span className="min-w-0 break-words">{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 rounded-3xl bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  {isAdmin ? "Artikel terbaru" : "Artikel saya terbaru"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin
                    ? "Pembaruan terakhir dari seluruh pengelola."
                    : "Lanjutkan draf atau periksa artikel yang sudah dikirim ke admin."}
                </p>
              </div>
              <Link
                to="/admin/articles"
                className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-bold text-green-700 hover:bg-green-50"
              >
                Lihat semua
              </Link>
            </div>

            {articles.length ? (
              <ul className="divide-y divide-gray-100">
                {articles.slice(0, 5).map((article) => (
                  <li key={article.id}>
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="flex flex-col gap-2 p-5 transition hover:bg-gray-50 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:p-6"
                    >
                      <span className="min-w-0 break-words font-bold text-gray-800">
                        {article.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <StatusBadge
                          status={isScheduled(article) ? "scheduled" : article.status}
                        />
                        <span>
                          Diperbarui {dateFormatter.format(new Date(article.updatedAt))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="newspaper"
                title={isAdmin ? "Belum ada artikel" : "Anda belum menulis artikel"}
                description={
                  isAdmin
                    ? "Artikel pertama bisa dibuat lewat tombol Tulis artikel."
                    : "Mulai dari draf. Admin akan meninjau dan menerbitkannya."
                }
              >
                <Link
                  to="/admin/articles/new"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
                >
                  Tulis artikel
                </Link>
              </EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
