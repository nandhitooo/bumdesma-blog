import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import podoRukun from "../assets/podo-rukun.png";
import bumdesmaNganjuk from "../assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useSiteContent } from "../lib/siteContent";
import { safeImageUrl } from "../lib/siteContentUtils";

// Rute dan ikon tetap; labelnya berasal dari konten situs (key `site.nav`).
const NAV_BASE = [
  { id: "home", to: "/#home", icon: "house", group: "primary" },
  { id: "about", to: "/#about", icon: "circle-info", group: "primary" },
  { id: "services", to: "/#services", icon: "gear", group: "primary" },
  { id: "activity", to: "/#activity", icon: "calendar", group: "primary" },
  { id: "contact", to: "/#contact", icon: "phone", group: "primary" },
  { id: "blog", to: "/blog", icon: "newspaper", group: "primary" },
  { id: "gallery", to: "/galeri", icon: "images", group: "more" },
  { id: "transparency", to: "/transparansi", icon: "file-lines", group: "more" },
  { id: "team", to: "/pengurus", icon: "people-group", group: "more" },
];

function buildNavItems(nav = {}) {
  return NAV_BASE.map((item) => ({ ...item, label: nav[item.id] || item.id }));
}

function NavItem({ item, active, mobile = false, onClick }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      aria-current={active ? "location" : undefined}
      className={`flex min-h-[44px] items-center text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
        mobile
          ? `w-full gap-3 rounded-lg px-3.5 py-2.5 ${
              active
                ? "bg-brand-light font-semibold text-brand-primary"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`
          : `border-b-2 px-3 py-1 ${
              active
                ? "border-brand-primary font-semibold text-brand-primary"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
            }`
      }`}
    >
      {mobile && (
        <i className={`fa-solid fa-${item.icon} w-5 text-center text-sm`} aria-hidden="true"></i>
      )}
      <span>{item.label}</span>
    </Link>
  );
}

function DesktopMoreMenu({ items, active, onNavClick, moreLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = "desktop-more-menu";
  const moreActive = items.some((item) => item.id === active);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleMouseDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex min-h-[44px] items-center gap-1.5 border-b-2 px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          moreActive
            ? "border-brand-primary font-semibold text-brand-primary"
            : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
        }`}
      >
        <span>{moreLabel}</span>
        <i
          className={`fa-solid fa-chevron-down text-[0.65rem] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        ></i>
      </button>

      {isOpen && (
        <ul
          id={menuId}
          className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-gray-200 bg-white py-1.5 shadow-sm"
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                aria-current={active === item.id ? "location" : undefined}
                onClick={() => {
                  setIsOpen(false);
                  onNavClick(item);
                }}
                className={`flex min-h-[44px] items-center px-4 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset ${
                  active === item.id
                    ? "bg-brand-light font-semibold text-brand-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function scrollToSection(section) {
  section?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}

function MobileNavigation({ active, onNavClick, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const desktopQuery = window.matchMedia("(min-width: 1536px)");
    const handleChange = (event) => {
      if (event.matches) {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    desktopQuery.addEventListener("change", handleChange);
    return () => desktopQuery.removeEventListener("change", handleChange);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xl text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 2xl:hidden"
        onClick={() => setIsOpen((open) => !open)}
      >
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
      </button>

      {isOpen && (
        <nav
          id="mobile-nav-drawer"
          className="absolute left-0 right-0 top-full max-h-[calc(100dvh-5rem-env(safe-area-inset-top))] overflow-y-auto overscroll-contain border-b border-t border-gray-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sm 2xl:hidden"
          aria-label="Navigasi Utama"
        >
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <NavItem
                  item={item}
                  mobile
                  active={active === item.id}
                  onClick={() => {
                    setIsOpen(false);
                    onNavClick(item);
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export default function Header() {
  const [scrollActive, setScrollActive] = useState("home");
  const location = useLocation();
  const { site } = useSiteContent();
  const navItems = buildNavItems(site.nav);
  const primaryItems = navItems.filter((item) => item.group === "primary");
  const moreItems = navItems.filter((item) => item.group === "more");
  const logoUrl = safeImageUrl(site.logoUrl, podoRukun);
  const partnerLogoUrl = safeImageUrl(site.partnerLogoUrl, bumdesmaNganjuk);
  const routeKey = `${location.pathname}${location.hash}`;
  const isBlog = location.pathname.startsWith("/blog");
  const isGallery = location.pathname.startsWith("/galeri");
  const isTransparency = location.pathname.startsWith("/transparansi");
  const isTeam = location.pathname.startsWith("/pengurus");
  const active = isBlog
    ? "blog"
    : isGallery
      ? "gallery"
      : isTransparency
        ? "transparency"
        : isTeam
          ? "team"
          : location.pathname === "/"
            ? scrollActive
            : "";

  useEffect(() => {
    if (location.pathname !== "/") return undefined;

    const sections = ["home", "about", "services", "activity", "contact"];
    const handleScroll = () => {
      const headerHeight = document.querySelector("header")?.offsetHeight || 72;
      const scrollPosition = window.scrollY + headerHeight + 1;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && scrollPosition >= section.offsetTop) {
          setScrollActive(sections[i]);
          return;
        }
      }
      setScrollActive("home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return undefined;

    const id = location.hash.slice(1);
    const section = document.getElementById(id);
    if (!section) return undefined;

    const preceding = Array.from(section.parentElement?.children || []);
    const sectionIndex = preceding.indexOf(section);
    let correctionTimer;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(correctionTimer);
      correctionTimer = window.setTimeout(() => scrollToSection(section), 80);
    });
    preceding
      .slice(0, sectionIndex)
      .forEach((element) => observer.observe(element));

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(section);
      setScrollActive(id);
    });
    const stopObserving = window.setTimeout(() => observer.disconnect(), 3000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(correctionTimer);
      window.clearTimeout(stopObserving);
      observer.disconnect();
    };
  }, [location.pathname, location.hash]);

  const handleNavClick = (item) => {
    if (
      location.pathname === "/" &&
      location.hash === `#${item.id}` &&
      item.id !== "blog"
    ) {
      scrollToSection(document.getElementById(item.id));
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/#home"
          aria-label={`${site.name}, ${site.nav?.home || "Beranda"}`}
          className="flex min-w-0 shrink items-center gap-3 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          onClick={() => {
            if (location.pathname === "/" && location.hash === "#home") {
              scrollToSection(document.getElementById("home"));
            }
          }}
        >
          <img
            src={partnerLogoUrl}
            alt={site.legalName}
            className="hidden h-9 w-9 shrink-0 object-contain sm:block"
          />
          <img
            src={logoUrl}
            alt={site.name}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-bold leading-tight tracking-tight text-gray-900">
              {site.name}
            </span>
            <span className="hidden truncate text-[11px] font-medium text-gray-500 sm:block">
              {site.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden 2xl:flex" aria-label="Navigasi Utama">
          <ul className="flex items-center gap-2 2xl:gap-4">
            {primaryItems.map((item) => (
              <li key={item.id}>
                <NavItem
                  item={item}
                  active={active === item.id}
                  onClick={() => handleNavClick(item)}
                />
              </li>
            ))}
            {moreItems.length > 0 && (
              <li>
                <DesktopMoreMenu
                  key={routeKey}
                  items={moreItems}
                  active={active}
                  onNavClick={handleNavClick}
                  moreLabel={site.nav?.more || "Lainnya"}
                />
              </li>
            )}
          </ul>
        </nav>

        <MobileNavigation
          key={routeKey}
          active={active}
          onNavClick={handleNavClick}
          items={navItems}
        />
      </div>
    </header>
  );
}
