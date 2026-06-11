import React from "react";
import Podorukun from "../Assets/podo-rukun.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion } from "framer-motion";

const About = () => {
  const Data = [
    {
      id: 1,
      paragraf:
        "BUMDesma PODO RUKUN LKD bermula dari Program Pengembangan Kecamatan atau PPK. Program ini berjalan bertahap sejak tahun 2003 hingga 2014. Tahapannya meliputi PPK Fase II Siklus 4 sampai Siklus 6, PPK Fase III, PPK PNPM, PNPM Generasi Sehat dan Cerdas, PNPM DSC, PNPM Open Menu, PNPM MP Optimalisasi, PNPM MP, serta PNPM MPD. Total dana yang diterima Kecamatan Wilangan mencapai Rp 11.353.000.000. Seiring waktu, PNPM MP berubah menjadi BUMDesa Bersama PODO RUKUN LKD Kecamatan Wilangan.",
    },
    {
      id: 2,
      paragraf:
        "BUMDesa Bersama PODO RUKUN LKD telah memperoleh persetujuan dan pengesahan resmi dari Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia. Legalitas ini dibuktikan melalui Sertifikat Pendaftaran Pendirian Badan Hukum Nomor AHU-00115.AH.01.35.Tahun 2022. Alamat kantor berada di Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Provinsi Jawa Timur. Status hukum ini menjadi dasar operasional dan pengelolaan usaha bersama.",
    },
  ];

  return (
    <section className="pt-24 pb-20 bg-white overflow-hidden" id="about">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900 leading-tight">
            Tentang <span className="text-green-700">BUMDESMA</span>
          </h2>
          <div className="w-20 h-1 bg-green-700 mx-auto mb-6 rounded-full"></div>
          <p className="text-base lg:text-lg text-gray-600 font-medium">
            Kecamatan Wilangan • Kabupaten Nganjuk • Jawa Timur
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/3 flex justify-center"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-green-100 rounded-full opacity-50 group-hover:opacity-100 blur-2xl transition duration-500"></div>
              <img
                src={Podorukun}
                alt="Podo Rukun Logo"
                className="relative w-56 md:w-72 lg:w-96 object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <div className="bg-gray-50 p-6 md:p-10 lg:p-12 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/50 rounded-bl-full -mr-10 -mt-10"></div>

              <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                pagination={{
                  clickable: true,
                }}
                autoplay={{ delay: 10000 }}
                className="custom-swiper"
              >
                {Data.map((item) => (
                  <SwiperSlide key={item.id} className="pb-4">
                    <p className="text-justify text-gray-700 text-sm md:text-base lg:text-xl leading-relaxed italic">
                      "{item.paragraf}"
                    </p>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="flex justify-center lg:justify-start mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-green-700 text-white font-bold px-6 py-3 lg:px-8 lg:py-4 rounded-2xl hover:bg-green-800 transition shadow-lg flex items-center gap-3 text-sm lg:text-base"
                  onClick={() =>
                    window.open(
                      "https://drive.google.com/file/d/1EvypZ1A4ly4bN0URJ0BAASBzNXsf2AWJ/view?usp=sharing",
                      "_blank",
                    )
                  }
                >
                  <span>Profil Lengkap</span>
                  <i className="fa-solid fa-file-pdf"></i>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
