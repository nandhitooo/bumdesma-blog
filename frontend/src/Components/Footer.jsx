import React from "react";
import podoRukun from "../Assets/podo-rukun.png";
import bumdesmaNganjuk from "../Assets/bumdesma-nganjuk.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={bumdesmaNganjuk}
                alt="BUMDESMA Nganjuk"
                className="h-10"
              />
              <img src={podoRukun} alt="Podo Rukun" className="h-10" />
              <span className="text-xl font-bold text-white tracking-tight">
                BUMDESMA
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              BUMDESMA Podo Rukun LKD berkomitmen untuk memajukan ekonomi desa
              melalui pengelolaan usaha yang profesional dan inovatif demi
              kesejahteraan masyarakat Kecamatan Wilangan.
            </p>
            <div className="flex gap-4">
              {["facebook", "instagram", "youtube", "whatsapp"].map(
                (social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-all duration-300 shadow-lg"
                  >
                    <i className={`fa-brands fa-${social}`}></i>
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Tautan Langsung
            </h3>
            <ul className="space-y-4">
              {[
                { label: "Beranda", id: "home" },
                { label: "Tentang Kami", id: "about" },
                { label: "Layanan Kami", id: "services" },
                { label: "Kegiatan Terbaru", id: "activity" },
                { label: "Hubungi Kami", id: "contact" },
              ].map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="hover:text-green-500 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Layanan Utama</h3>
            <ul className="space-y-4">
              {[
                "Dana Bergulir Masyarakat",
                "Pembelian Kredit",
                "Keagenan Bank",
                "Penyewaan Elf",
                "PT. LKM Artha Tanjung",
              ].map((service) => (
                <li key={service} className="text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Informasi Kontak
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm leading-relaxed">
                <i className="fa-solid fa-location-dot text-green-600 mt-1"></i>
                <span>
                  Jl. Wilis, Wilangan, Kec. Wilangan, Kab. Nganjuk, Jawa Timur
                  64462
                </span>
              </li>
              <li className="flex gap-3 text-sm">
                <i className="fa-solid fa-phone text-green-600"></i>
                <span>+62 851-5616-2917</span>
              </li>
              <li className="flex gap-3 text-sm">
                <i className="fa-solid fa-envelope text-green-600"></i>
                <span>bumdesmapodorukun@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {currentYear} BUMDesma PODO RUKUN LKD. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:text-white transition">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
