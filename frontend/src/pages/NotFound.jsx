import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-8 sm:p-10">
          <p className="text-6xl font-bold text-brand-primary mb-3">404</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-gray-600 mb-6 break-words">
            Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors motion-reduce:transition-none hover:bg-brand-dark"
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
