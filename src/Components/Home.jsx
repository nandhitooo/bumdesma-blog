import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Home = () => {
  return (
    <section className="pt-32 pb-20 bg-white" id="home">
      <div className="container mx-auto px-5 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-700 leading-snug">
          SELAMAT DATANG
        </h1>

        <p className="mt-4 text-base sm:text-lg md:text-xl font-semibold text-gray-700">
          Website Resmi BUMDESMA Podo Rukun LKD
        </p>

        <p className="mt-6 text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl md:max-w-3xl mx-auto leading-relaxed">
          BUMDESMA Podo Rukun LKD berperan sebagai penggerak ekonomi desa. Kami
          mengelola usaha bersama secara profesional dan transparan. Fokus kami
          adalah menciptakan kemandirian desa dan kesejahteraan masyarakat.
        </p>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300">
            <i className="fas fa-briefcase text-3xl text-green-700 mb-4"></i>
            <h3 className="font-semibold text-base md:text-lg mb-2">
              Pengelolaan Usaha
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              Mengelola unit usaha desa secara terstruktur dan berkelanjutan.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300">
            <i className="fas fa-users text-3xl text-green-700 mb-4"></i>
            <h3 className="font-semibold text-base md:text-lg mb-2">
              Pemberdayaan Warga
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              Mendorong partisipasi aktif masyarakat dalam kegiatan ekonomi
              desa.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300 sm:col-span-2 lg:col-span-1">
            <i className="fas fa-chart-line text-3xl text-green-700 mb-4"></i>
            <h3 className="font-semibold text-base md:text-lg mb-2">
              Pertumbuhan Ekonomi
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              Meningkatkan pendapatan desa melalui kolaborasi dan inovasi.
            </p>
          </div>
        </div>

        <button
          className="mt-16 bg-green-700 text-white font-semibold py-3 px-8 rounded-xl hover:bg-green-800 hover:scale-105 transition duration-300"
          onClick={() => {
            const aboutSection = document.getElementById("about");
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Jelajahi Lebih Lanjut
        </button>
      </div>
    </section>
  );
};

export default Home;
