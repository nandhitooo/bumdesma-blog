import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { usePageTitle } from "../lib/usePageTitle";

function NotFound() {
  usePageTitle("Halaman tidak ditemukan");

  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-lg p-8 sm:p-10 shadow-sm">
          <p className="text-6xl font-bold text-brand-primary mb-3">404</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-gray-600 mb-6 break-words leading-relaxed">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center bg-brand-primary px-6 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default NotFound;
