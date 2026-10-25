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
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
        {/* At most 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 mb-12">
          {/* Column 1: Brand & Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={bumdesmaNganjuk}
                alt="BUMDESMA Nganjuk"
                className="h-8 w-8 object-contain brightness-95"
                loading="lazy"
                decoding="async"
              />
              <img
                src={podoRukun}
                alt="Podo Rukun"
                className="h-8 w-8 object-contain brightness-95"
                loading="lazy"
                decoding="async"
              />
              <span className="min-w-0 break-words text-lg font-bold text-white tracking-tight">
                BUMDESMA
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 break-words">
              {footer.description}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-label={item.label}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex h-11 w-11 items-center justify-center rounded bg-gray-800 text-xs text-gray-300 transition-colors motion-reduce:transition-none hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
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
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#home" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/#about" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/#services" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Layanan Usaha
                </Link>
              </li>
              <li>
                <Link to="/#activity" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Kegiatan Terbaru
                </Link>
              </li>
              <li>
                <Link to="/blog" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Blog & Artikel
                </Link>
              </li>
              <li>
                <Link to="/faq" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-white transition-colors motion-reduce:transition-none">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Kontak & Legalitas */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Kontak Kantor
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex min-w-0 items-start gap-2.5">
                <i className="fa-solid fa-location-dot text-brand-primary mt-1 shrink-0" aria-hidden="true"></i>
                <span className="min-w-0 break-words">
                  {footer.address}
                </span>
              </li>
              {footer.phone && (
                <li className="flex min-w-0 items-center gap-2.5">
                  <i className="fa-solid fa-phone shrink-0 text-brand-primary" aria-hidden="true"></i>
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
                <li className="flex min-w-0 items-center gap-2.5">
                  <i className="fa-solid fa-envelope shrink-0 text-brand-primary" aria-hidden="true"></i>
                  <a
                    href={safeMailto(footer.email)}
                    className="inline-flex min-h-[44px] min-w-0 items-center break-words hover:text-white transition-colors motion-reduce:transition-none"
                  >
                    {footer.email}
                  </a>
                </li>
              )}
              <li className="pt-2 border-t border-gray-800 text-sm text-gray-500">
                Badan Hukum: AHU-00115.AH.01.35.Tahun 2022
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>© {currentYear} BUMDesma PODO RUKUN LKD. Hak Cipta Dilindungi.</p>
          <p className="text-sm">Kecamatan Wilangan, Kabupaten Nganjuk</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
