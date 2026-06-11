import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion } from "framer-motion";

const Service = () => {
  const services = [
    {
      icon: "fa-coins",
      title: "Dana Bergulir Masyarakat",
      desc: "Penyediaan modal usaha berkelanjutan bagi kelompok masyarakat desa guna meningkatkan kemandirian ekonomi dan kesejahteraan keluarga.",
    },
    {
      icon: "fa-credit-card",
      title: "Pembelian Kredit",
      desc: "Layanan pembelian barang secara kredit dengan syarat mudah dan cicilan terjangkau untuk kebutuhan usaha maupun rumah tangga.",
    },
    {
      icon: "fa-building-columns",
      title: "Keagenan Bank",
      desc: "Layanan tarik tunai, transfer, dan pembayaran tagihan tanpa perlu ke bank.",
    },
    {
      icon: "fa-bus-simple",
      title: "Penyewaan Elf",
      desc: "Sewa armada Elf dengan driver berpengalaman untuk perjalanan dalam dan luar kota.",
    },
    {
      icon: "fa-landmark",
      title: "PT. LKM",
      desc: "Layanan keuangan mikro desa untuk mendukung pertumbuhan ekonomi melalui pembiayaan dan pendampingan usaha.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="pt-24 pb-20 bg-gray-50" id="services">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
            Layanan <span className="text-green-700">Kami</span>
          </h2>
          <div className="w-24 h-1.5 bg-green-700 mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami menyediakan berbagai layanan profesional untuk mendukung
            pertumbuhan ekonomi dan kemandirian masyarakat desa.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -10,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-green-300 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-700 transition-colors duration-300">
                <i
                  className={`fa-solid ${service.icon} text-2xl text-green-700 group-hover:text-white transition-colors duration-300`}
                ></i>
              </div>

              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {service.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">{service.desc}</p>

              <div className="mt-6 flex items-center text-green-700 font-semibold cursor-pointer group-hover:translate-x-2 transition-transform duration-300">
                <span>Pelajari Selengkapnya</span>
                <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Service;
