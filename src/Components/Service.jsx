import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

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

  return (
    <section className="pt-24 pb-16 bg-gray-100" id="services">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">
          Layanan Kami
        </h2>

        <p className="text-center max-w-2xl mx-auto mb-12 text-gray-700">
          Kami menyediakan berbagai layanan untuk mendukung kebutuhan masyarakat
          desa.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-md border border-green-600 hover:shadow-lg hover:scale-105 transition duration-300"
            >
              <div className="mb-4 text-green-700 text-2xl">
                <i className={`fa-solid ${service.icon}`}></i>
              </div>

              <h3 className="text-lg md:text-xl font-semibold mb-3">
                {service.title}
              </h3>

              <p className="text-gray-700 text-sm md:text-base">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Service;
