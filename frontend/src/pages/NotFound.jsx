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
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 pt-24">
        <div className="max-w-xl text-center">
          <p className="mb-4 text-7xl font-extrabold text-green-700">404</p>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Halaman tidak ditemukan
          </h1>
          <p className="mb-8 text-gray-600">
            Halaman yang Anda cari tidak tersedia.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
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
