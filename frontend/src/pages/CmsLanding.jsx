import { useEffect } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Daftar fitur modul CMS. Semua fitur di bawah tersedia di panel /admin.
const features = [
  {
    icon: "fa-pen-to-square",
    title: "Editor Artikel",
    desc: "Tulis dan rapikan artikel langsung di panel dengan editor teks lengkap: judul, daftar, kutipan, tautan, dan gambar.",
  },
  {
    icon: "fa-layer-group",
    title: "Kategori",
    desc: "Kelompokkan artikel ke dalam kategori agar pengunjung mudah menemukan berita dan kegiatan yang relevan.",
  },
  {
    icon: "fa-user-shield",
    title: "Peran Admin & Editor",
    desc: "Admin mengelola seluruh konten dan pengguna, sedangkan editor hanya mengelola artikel miliknya sendiri.",
  },
  {
    icon: "fa-image",
    title: "Unggah Gambar",
    desc: "Unggah gambar sampul dan gambar di dalam artikel. Format JPG, PNG, atau WebP dengan batas 2 MB per berkas.",
  },
  {
    icon: "fa-code-branch",
    title: "Alur Draf & Terbit",
    desc: "Simpan tulisan sebagai draf lebih dulu, lalu terbitkan saat sudah siap ditampilkan di halaman blog.",
  },
  {
    icon: "fa-gauge",
    title: "Ringkasan Konten",
    desc: "Pantau jumlah artikel terbit dan draf dari halaman ringkasan sebelum menentukan langkah berikutnya.",
  },
];

const steps = [
  {
    number: "1",
    title: "Masuk dengan akun pengelola",
    desc: "Gunakan email dan kata sandi akun yang dibuat admin. Sesi login disimpan aman pada cookie httpOnly.",
  },
  {
    number: "2",
    title: "Tulis dan atur artikel",
    desc: "Buat artikel baru, pilih kategori, unggah gambar sampul, lalu simpan sebagai draf untuk ditinjau kembali.",
  },
  {
    number: "3",
    title: "Terbitkan ke halaman blog",
    desc: "Setelah siap, ubah status menjadi terbit. Artikel langsung tampil di halaman blog publik beserta tanggalnya.",
  },
];

function CmsLanding() {
  useEffect(() => {
    document.title = "Modul CMS | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="bg-white py-16 sm:py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold tracking-wider text-brand-primary uppercase mb-4">
              Modul CMS
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
              Kelola Konten Situs BUMDESMA dari Satu Panel
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
              Modul CMS BUMDESMA Podo Rukun LKD membantu pengelola menulis
              artikel, mengatur kategori, mengunggah gambar, dan menerbitkan
              informasi desa tanpa menyentuh kode sama sekali.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-dark text-white text-sm sm:text-base font-medium px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                <span>Masuk ke Panel CMS</span>
                <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm sm:text-base font-medium px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                <span>Lihat Blog Publik</span>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Akses panel hanya untuk pengelola yang sudah memiliki akun admin
              atau editor.
            </p>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="bg-gray-50 py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
              Fitur Utama
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3">
              Semua yang Dibutuhkan Pengelola
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Fitur disusun sederhana supaya pengurus desa dapat mengelola
              publikasi secara mandiri dan konsisten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 sm:p-7 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-11 h-11 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary mb-5">
                  <i
                    className={`fa-solid ${feature.icon} text-lg`}
                    aria-hidden="true"
                  ></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
              Cara Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3">
              Tiga Langkah Menerbitkan Artikel
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Dari login sampai artikel tampil di halaman blog publik.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <li
                key={step.number}
                className="bg-gray-50 p-6 sm:p-7 rounded-xl border border-gray-200"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-primary text-white text-sm font-bold flex items-center justify-center mb-5">
                  {step.number}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ajakan */}
      <section className="bg-brand-primary py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                Siap Mengelola Konten Desa?
              </h2>
              <p className="text-sm sm:text-base text-brand-light leading-relaxed">
                Masuk ke panel CMS untuk mulai menulis artikel, mengatur
                kategori, dan menerbitkan kabar terbaru BUMDESMA.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to="/admin/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-white hover:bg-gray-50 text-brand-dark text-sm sm:text-base font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary"
              >
                <i className="fa-solid fa-right-to-bracket text-xs" aria-hidden="true"></i>
                <span>Masuk ke Panel CMS</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CmsLanding;
