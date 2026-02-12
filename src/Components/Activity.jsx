import React, { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import kegiatan1 from "../Assets/kegiatan/kegiatan1.jpg";
import kegiatan2 from "../Assets/kegiatan/kegiatan2.jpg";
import kegiatan3 from "../Assets/kegiatan/kegiatan3.jpg";
import kegiatan4 from "../Assets/kegiatan/kegiatan4.jpg";
import kegiatan5 from "../Assets/kegiatan/kegiatan5.jpg";
import kegiatan6 from "../Assets/kegiatan/kegiatan6.jpg";
import kegiatan7 from "../Assets/kegiatan/kegiatan7.jpg";
import kegiatan8 from "../Assets/kegiatan/kegiatan8.jpg";
import kegiatan9 from "../Assets/kegiatan/kegiatan9.jpg";
import kegiatan10 from "../Assets/kegiatan/kegiatan10.jpg";
import kegiatan11 from "../Assets/kegiatan/kegiatan11.jpg";
import kegiatan12 from "../Assets/kegiatan/kegiatan12.jpg";

const Activity = () => {
  const items = [
    { img: kegiatan1, text: "Evaluasi Kinerja Bumdesma tahun 2023", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan2, text: "Bazar Produk Desa", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan3, text: "Dolan bareng kelembagaan BUMDESMA", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan4, text: "Muasyawarah Antar Desa (MAD)", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan5, text: "Penyaluran bantuan sosial", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan6, text: "Pembinaan kelompok SPP/UEP", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan7, text: "Rapat koordinasi", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan8, text: "Launching PT LKM ARTHA TANJUNG MANDIRI", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan9, text: "Bimtek aplikasi laporan keuangan", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan10, text: "Rapat koordinasi", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan11, text: "Gerak jalan agustusan", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
    { img: kegiatan12, text: "Pelatihan", logo: <i className="fa-solid fa-thumbtack text-green-700"></i> },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="pt-24 pb-16 bg-white" id="activity">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">
          Kegiatan Kami
        </h2>

        <p className="text-center max-w-2xl mx-auto mb-12 text-gray-700">
          Dokumentasi kegiatan dan program yang telah dilaksanakan untuk
          mendukung pengembangan desa.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition duration-300"
            >
              <img
                src={item.img}
                alt={item.text}
                className="w-full h-48 md:h-56 object-cover"
              />
              <div className="p-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                  {item.logo} {item.text}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10 space-x-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="flex items-center font-semibold">
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default Activity;
