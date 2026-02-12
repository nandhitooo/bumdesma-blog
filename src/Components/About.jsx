import React from "react";
import Podorukun from "../Assets/podo-rukun.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

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
    <section className="pt-24 pb-16 bg-gray-100" id="about">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
          Tentang BUMDESMA
        </h2>

        <p className="text-center mb-10 text-gray-700 text-sm md:text-base">
          Desa Wilangan - Kec. Wilangan - Kab. Nganjuk
        </p>

        <div className="flex flex-col md:flex-row items-center gap-15">
          <div className="w-full md:w-1/3 flex justify-center">
            <img
              src={Podorukun}
              alt="Podo Rukun Logo"
              className="w-64 md:w-80 object-contain"
            />
          </div>

          <div className="w-full md:w-1/2">
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              pagination={{ clickable: false }}
              autoplay={{ delay: 9000 }}
              loop
            >
              {Data.map((item) => (
                <SwiperSlide key={item.id}>
                  <p className="text-justify text-sm md:text-lg mb-10 leading-relaxed text-gray-800">
                    {item.paragraf}
                  </p>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="flex justify-center mt-2">
              <button
                className="bg-green-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-800 transition"
                onClick={() =>
                  window.open(
                    "https://drive.google.com/file/d/1EvypZ1A4ly4bN0URJ0BAASBzNXsf2AWJ/view?usp=sharing",
                    "_blank",
                  )
                }
              >
                Lihat Selengkapnya <i className="fa-solid fa-book ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
