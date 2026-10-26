import { Link } from "react-router-dom";
import podoRukun from "../assets/podo-rukun.png";
import bumdesmaNganjuk from "../assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useSiteContent } from "../lib/siteContent";
import {
  safeMailto,
  safePhoneLink,
  safeWaLink,
  safeHttpsUrl,
  isValidIcon,
} from "../lib/siteContentUtils";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { footer, contact } = useSiteContent();

  const socialLinks = [
    {
      name: "whatsapp",
      href: contact.whatsapp ? safeWaLink(contact.whatsapp) : "",
      label: "WhatsApp",
      isSolid: false,
      isBrand: true,
    },
    {
      name: "envelope",
      href: footer.email ? safeMailto(footer.email) : "",
      label: "Email",
      isSolid: true,
      isBrand: false,
    },
    {
      name: "facebook",
      href: safeHttpsUrl(footer.social?.facebook),
      label: "Facebook",
      isSolid: false,
      isBrand: true,
    },
    {
      name: "instagram",
      href: safeHttpsUrl(footer.social?.instagram),
      label: "Instagram",
      isSolid: false,
      isBrand: true,
    },
    {
      name: "youtube",
      href: safeHttpsUrl(footer.social?.youtube),
      label: "YouTube",
      isSolid: false,
      isBrand: true,
    },
  ].filter((item) => Boolean(item.href) && item.href !== "#" && isValidIcon(item.name));

  return (
    <footer className="bg-brand-dark text-gray-300 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 4 Columns in Desktop, 1 Column in Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* Column 1: Brand & Profile */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={bumdesmaNganjuk}
                alt="BUMDESMA Nganjuk"
                className="h-8 w-8 object-contain"
                loading="lazy"
                decoding="async"
              />
              <img
                src={podoRukun}
                alt="Podo Rukun"
                className="h-8 w-8 object-contain"
                loading="lazy"
                decoding="async"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  BUMDESMA Podo Rukun
                </span>
                <span className="text-xs text-emerald-200/70">
                  LKD Kec. Wilangan
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-6 break-words">
              {footer.description}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-auto">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-label={item.label}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white text-sm transition-colors motion-reduce:transition-none hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <i
                      className={`${item.isBrand ? "fa-brands" : "fa-solid"} fa-${item.name}`}
                      aria-hidden="true"
                    ></i>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Tautan Halaman */}
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
              Tautan Navigasi
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  to="/#home"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Blog & Berita
                </Link>
              </li>
              <li>
                <Link
                  to="/galeri"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Galeri Dokumentasi
                </Link>
              </li>
              <li>
                <Link
                  to="/transparansi"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Transparansi Laporan
                </Link>
              </li>
              <li>
                <Link
                  to="/pengurus"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Susunan Pengurus
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Tanya Jawab (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Unit Layanan */}
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
              Unit Layanan Usaha
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  to="/layanan"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Dana Bergulir Masyarakat (SPP)
                </Link>
              </li>
              <li>
                <Link
                  to="/layanan"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Perdagangan & Jasa Desa
                </Link>
              </li>
              <li>
                <Link
                  to="/layanan"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Penguatan Usaha Warga
                </Link>
              </li>
              <li>
                <Link
                  to="/layanan"
                  className="inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none"
                >
                  Syarat & Alur Pengajuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Kontak Kantor */}
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
              Kontak Kantor
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex min-w-0 items-start gap-3">
                <i
                  className="fa-solid fa-location-dot text-emerald-400 mt-1 shrink-0 text-sm"
                  aria-hidden="true"
                ></i>
                <span className="min-w-0 break-words leading-relaxed">
                  {footer.address}
                </span>
              </li>
              {footer.phone && (
                <li className="flex min-w-0 items-center gap-3">
                  <i
                    className="fa-solid fa-phone shrink-0 text-emerald-400 text-sm"
                    aria-hidden="true"
                  ></i>
                  {safePhoneLink(footer.phone) ? (
                    <a
                      href={safePhoneLink(footer.phone)}
                      className="inline-flex min-h-[44px] min-w-0 items-center break-words hover:text-white transition-colors motion-reduce:transition-none"
                    >
                      {footer.phone}
                    </a>
                  ) : (
                    <span className="min-w-0 break-words">{footer.phone}</span>
                  )}
                </li>
              )}
              {safeMailto(footer.email) && (
                <li className="flex min-w-0 items-center gap-3">
                  <i
                    className="fa-solid fa-envelope shrink-0 text-emerald-400 text-sm"
                    aria-hidden="true"
                  ></i>
                  <a
                    href={safeMailto(footer.email)}
                    className="inline-flex min-h-[44px] min-w-0 items-center break-words hover:text-white transition-colors motion-reduce:transition-none"
                  >
                    {footer.email}
                  </a>
                </li>
              )}
              <li className="pt-3 border-t border-white/10 text-xs text-emerald-200/70">
                Badan Hukum AHU-00115.AH.01.35.Tahun 2022
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer / Copyright Row */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>© {currentYear} BUMDESMA Podo Rukun LKD. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Kecamatan Wilangan, Kabupaten Nganjuk</span>
            <span className="text-gray-600">•</span>
            <Link
              to="/admin/login"
              className="hover:text-white transition-colors motion-reduce:transition-none"
            >
              Portal Pengelola
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
