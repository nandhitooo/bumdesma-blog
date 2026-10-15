import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion } from "framer-motion";
import bgImage from "../Assets/background.jpg";

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      className="relative min-h-screen flex items-center pt-28 pb-16 lg:pt-20 lg:pb-20 overflow-hidden"
      id="home"
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-white/95 via-white/90 to-white/95 lg:from-white/90 lg:via-white/80 lg:to-white/95"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container mx-auto px-6 text-center relative z-10"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-green-700 leading-tight tracking-tight px-2"
        >
          SELAMAT DATANG
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800"
        >
          Website Resmi{" "}
          <span className="text-green-600">BUMDESMA Podo Rukun LKD</span>
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="mt-6 lg:mt-8 text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
        >
          BUMDESMA Podo Rukun LKD berperan sebagai penggerak ekonomi desa
          melalui pengelolaan usaha bersama secara profesional, transparan, dan
          inovatif.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {[
            {
              icon: "briefcase",
              title: "Pengelolaan Usaha",
              desc: "Mengelola unit usaha desa secara terstruktur dan berkelanjutan.",
            },
            {
              icon: "users",
              title: "Pemberdayaan Warga",
              desc: "Mendorong partisipasi aktif masyarakat dalam kegiatan ekonomi desa.",
            },
            {
              icon: "chart-line",
              title: "Pertumbuhan Ekonomi",
              desc: "Meningkatkan pendapatan desa melalui kolaborasi dan inovasi.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, translateY: -5 }}
              className="bg-white/90 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-xl border border-white/50 hover:border-green-200 transition-all duration-300"
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6">
                <i
                  className={`fas fa-${item.icon} text-2xl lg:text-3xl text-green-700`}
                ></i>
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 text-gray-800">
                {item.title}
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(21, 128, 61, 0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          className="mt-12 lg:mt-20 bg-green-700 text-white font-bold py-3 px-8 lg:py-4 lg:px-10 rounded-2xl hover:bg-green-800 transition duration-300 shadow-lg text-sm lg:text-base"
          onClick={() => {
            const aboutSection = document.getElementById("about");
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Jelajahi Lebih Lanjut
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Home;
