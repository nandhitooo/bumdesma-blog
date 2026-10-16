import { Link } from "react-router-dom";
import podoRukun from "../assets/podo-rukun.png";
import bumdesmaNganjuk from "../assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* At most 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 mb-12">
          {/* Column 1: Brand & Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={bumdesmaNganjuk}
                alt="BUMDESMA Nganjuk"
                className="h-8 w-auto brightness-95"
              />
              <img
                src={podoRukun}
                alt="Podo Rukun"
                className="h-8 w-auto brightness-95"
              />
              <span className="text-lg font-bold text-white tracking-tight">
                BUMDESMA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
              BUMDESMA Podo Rukun LKD berkomitmen memajukan perekonomian desa melalui pengelolaan usaha yang profesional, transparan, dan inovatif demi kesejahteraan masyarakat Kecamatan Wilangan.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { name: "whatsapp", href: "https://wa.me/6285156162917", label: "WhatsApp" },
                { name: "envelope", href: "mailto:bumdesmapodorukun@gmail.com", label: "Email", isSolid: true },
                { name: "facebook", href: "#", label: "Facebook" },
                { name: "instagram", href: "#", label: "Instagram" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  aria-label={item.label}
                  className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors text-xs"
                >
                  <i className={`${item.isSolid ? "fa-solid" : "fa-brands"} fa-${item.name}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Tautan Halaman */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="/#home" className="hover:text-white transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-white transition-colors">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="/#services" className="hover:text-white transition-colors">
                  Layanan Usaha
                </a>
              </li>
              <li>
                <a href="/#activity" className="hover:text-white transition-colors">
                  Kegiatan Terbaru
                </a>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog & Artikel
                </Link>
              </li>
              <li>
                <a href="/#contact" className="hover:text-white transition-colors">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Kontak & Legalitas */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Kontak Kantor
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <i className="fa-solid fa-location-dot text-brand-primary mt-1 shrink-0" aria-hidden="true"></i>
                <span>
                  Jln. Makam Syekh Sulukhi, Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kec. Wilangan, Kab. Nganjuk, Jawa Timur 64462
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <i className="fa-solid fa-phone text-brand-primary shrink-0" aria-hidden="true"></i>
                <a href="tel:+6285156162917" className="hover:text-white transition-colors">
                  +62 851-5616-2917
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <i className="fa-solid fa-envelope text-brand-primary shrink-0" aria-hidden="true"></i>
                <a href="mailto:bumdesmapodorukun@gmail.com" className="hover:text-white transition-colors">
                  bumdesmapodorukun@gmail.com
                </a>
              </li>
              <li className="pt-2 border-t border-gray-800 text-[11px] text-gray-500">
                Badan Hukum: AHU-00115.AH.01.35.Tahun 2022
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {currentYear} BUMDesma PODO RUKUN LKD. Hak Cipta Dilindungi.</p>
          <p className="text-[11px]">Kecamatan Wilangan, Kabupaten Nganjuk</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
