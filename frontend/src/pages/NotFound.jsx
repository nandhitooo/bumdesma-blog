import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

function NotFound() {
  useEffect(() => {
    document.title = "Halaman tidak ditemukan | BUMDESMA Podo Rukun LKD";
    return () => {
      document.title = "BUMDESMA Podo Rukun LKD";
    };
  }, []);

  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 sm:px-6 py-20">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-8 sm:p-10">
          <p className="text-6xl font-bold text-brand-primary mb-3">404</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
          </p>
          <Link
            to="/"
            className="inline-flex bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
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
