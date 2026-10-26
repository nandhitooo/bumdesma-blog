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
  safeFooterHref,
  safeImageUrl,
  isValidIcon,
} from "../lib/siteContentUtils";

const linkClass =
  "inline-flex min-h-[44px] items-center text-gray-300 hover:text-white transition-colors motion-reduce:transition-none";

function FooterLink({ item }) {
  const href = safeFooterHref(item?.href);
  if (!href) return null;

  const label = item.label || href;
  return (
    <li>
      {href.startsWith("https://") ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {label}
        </a>
      ) : (
        <Link to={href} className={linkClass}>
          {label}
        </Link>
      )}
    </li>
  );
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { footer, contact, site } = useSiteContent();

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

  const navLinks = Array.isArray(footer.navLinks) ? footer.navLinks : [];
  const serviceLinks = Array.isArray(footer.serviceLinks) ? footer.serviceLinks : [];

  return (
    <footer
      id="site-footer"
      className="bg-brand-dark text-gray-300 border-t border-emerald-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 4 Columns in Desktop, 1 Column in Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* Column 1: Brand & Profile */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={safeImageUrl(site.partnerLogoUrl, bumdesmaNganjuk)}
                alt={site.legalName}
                className="h-8 w-8 object-contain"
                loading="lazy"
                decoding="async"
              />
              <img
                src={safeImageUrl(site.logoUrl, podoRukun)}
                alt={site.name}
                className="h-8 w-8 object-contain"
                loading="lazy"
                decoding="async"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  {site.name}
                </span>
                <span className="text-xs text-emerald-200/70">
                  {footer.brandTagline}
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
              {footer.navHeading}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {navLinks.map((item, index) => (
                <FooterLink key={`${item.label}-${index}`} item={item} />
              ))}
            </ul>
          </div>

          {/* Column 3: Unit Layanan */}
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
              {footer.servicesHeading}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {serviceLinks.map((item, index) => (
                <FooterLink key={`${item.label}-${index}`} item={item} />
              ))}
            </ul>
          </div>

          {/* Column 4: Kontak */}
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
              {footer.contactHeading}
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
              {footer.legalNote && (
                <li className="pt-3 border-t border-white/10 text-xs text-emerald-200/70">
                  {footer.legalNote}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Sub-footer / Copyright Row */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>© {currentYear} {site.copyright}</p>
          <div className="flex items-center gap-4">
            <span>{site.locationLine}</span>
            <span className="text-gray-600">•</span>
            <Link
              to="/admin/login"
              className="hover:text-white transition-colors motion-reduce:transition-none"
            >
              {site.adminPortalLabel}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
