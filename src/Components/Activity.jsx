import React, { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion, AnimatePresence } from "framer-motion";
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
    {
      img: kegiatan1,
      text: "Evaluasi Kinerja Bumdesma tahun 2023",
      category: "Internal",
    },
    { img: kegiatan2, text: "Bazar Produk Desa", category: "Event" },
    {
      img: kegiatan3,
      text: "Dolan bareng kelembagaan BUMDESMA",
      category: "Gathering",
    },
    {
      img: kegiatan4,
      text: "Muasyawarah Antar Desa (MAD)",
      category: "Internal",
    },
    { img: kegiatan5, text: "Penyaluran bantuan sosial", category: "Sosial" },
    { img: kegiatan6, text: "Pembinaan kelompok SPP/UEP", category: "Edukasi" },
    { img: kegiatan7, text: "Rapat koordinasi", category: "Internal" },
    {
      img: kegiatan8,
      text: "Launching PT LKM ARTHA TANJUNG MANDIRI",
      category: "Bisnis",
    },
    {
      img: kegiatan9,
      text: "Bimtek aplikasi laporan keuangan",
      category: "Edukasi",
    },
    { img: kegiatan10, text: "Rapat koordinasi", category: "Internal" },
    { img: kegiatan11, text: "Gerak jalan agustusan", category: "Event" },
    { img: kegiatan12, text: "Pelatihan", category: "Edukasi" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="pt-24 pb-20 bg-gray-50" id="activity">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
            Kegiatan <span className="text-green-700">Terbaru</span>
          </h2>
          <div className="w-24 h-1.5 bg-green-700 mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dokumentasi berbagai program dan kegiatan yang telah kami laksanakan
            untuk memajukan ekonomi desa.
          </p>
        </motion.div>

        <motion.div
          key={currentPage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {currentItems.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="relative overflow-hidden h-64">
                <img
                  src={item.img}
                  alt={item.text}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 leading-tight group-hover:text-green-700 transition-colors duration-300">
                  {item.text}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-wrap justify-center mt-12 lg:mt-16 gap-3 md:gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="flex items-center gap-2 px-5 lg:px-8 py-2.5 lg:py-3 bg-white text-green-700 font-bold rounded-xl md:rounded-2xl shadow-md border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs md:text-sm lg:text-base"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span className="hidden xs:inline">Sebelumnya</span>
          </motion.button>

          <div className="flex items-center px-4 md:px-6 bg-green-700 text-white font-bold rounded-xl md:rounded-2xl shadow-inner text-xs md:text-sm lg:text-base">
            {currentPage} / {totalPages}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="flex items-center gap-2 px-5 lg:px-8 py-2.5 lg:py-3 bg-white text-green-700 font-bold rounded-xl md:rounded-2xl shadow-md border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs md:text-sm lg:text-base"
          >
            <span className="hidden xs:inline">Selanjutnya</span>
            <i className="fa-solid fa-arrow-right"></i>
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default Activity;
