import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import podoRukun from "../assets/podo-rukun.png";
import bumdesmaNganjuk from "../assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const NAV_ITEMS = [
  { id: "home", label: "Beranda", to: "/#home", icon: "house", group: "primary" },
  { id: "about", label: "Tentang", to: "/#about", icon: "circle-info", group: "primary" },
  { id: "services", label: "Layanan", to: "/#services", icon: "gear", group: "primary" },
  { id: "activity", label: "Kegiatan", to: "/#activity", icon: "calendar", group: "primary" },
  { id: "contact", label: "Kontak", to: "/#contact", icon: "phone", group: "primary" },
  { id: "blog", label: "Blog", to: "/blog", icon: "newspaper", group: "primary" },
  { id: "gallery", label: "Galeri", to: "/galeri", icon: "images", group: "more" },
  { id: "transparency", label: "Transparansi", to: "/transparansi", icon: "file-lines", group: "more" },
  { id: "team", label: "Pengurus", to: "/pengurus", icon: "people-group", group: "more" },
];

const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.group === "primary");
const MORE_ITEMS = NAV_ITEMS.filter((item) => item.group === "more");

function NavItem({ item, active, mobile = false, onClick }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      aria-current={active ? "location" : undefined}
      className={`flex min-h-[44px] items-center border-b-2 px-3 text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
        mobile ? "w-full gap-3 rounded-sm" : "px-2"
      } ${
        active
          ? "border-brand-primary text-brand-primary"
          : "border-transparent text-gray-600 hover:text-gray-900"
      }`}
    >
      {mobile && (
        <i className={`fa-solid fa-${item.icon} w-5 text-center`} aria-hidden="true"></i>
      )}
      <span>{item.label}</span>
    </Link>
  );
}

function DesktopMoreMenu({ items, active, onNavClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = "desktop-more-menu";
  const moreActive = items.some((item) => item.id === active);

  // Klik di luar dan Escape hanya dipasang selama dropdown terbuka.
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
        className={`flex min-h-[44px] items-center gap-2 border-b-2 px-2 text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          moreActive
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-600 hover:text-gray-900"
        }`}
      >
        <span>Lainnya</span>
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
          className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
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
                className={`flex min-h-[44px] items-center px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset ${
                  active === item.id
                    ? "text-brand-primary"
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

function MobileNavigation({ active, onNavClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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

  // Drawer tidak boleh tertinggal terbuka saat layar melewati breakpoint xl.
  useEffect(() => {
    if (!isOpen) return undefined;
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
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
      {/* Mobile Toggle */}
      <button
        type="button"
        ref={toggleRef}
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-xl text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 xl:hidden"
        onClick={() => setIsOpen((open) => !open)}
      >
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <nav
          id="mobile-nav-drawer"
          className="absolute left-0 right-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:hidden"
          aria-label="Navigasi Utama"
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
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

  // Track active scroll position on homepage.
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

  // Handle scroll to hash upon navigation to /.
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return undefined;

    const id = location.hash.slice(1);
    const section = document.getElementById(id);
    if (!section) return undefined;

    const preceding = Array.from(section.parentElement?.children || []);
    const sectionIndex = preceding.indexOf(section);
    const observer = new ResizeObserver(() => {
      window.clearTimeout(correctionTimer);
      correctionTimer = window.setTimeout(() => scrollToSection(section), 80);
    });
    let correctionTimer;
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
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-3 sm:px-6">
        <Link
          to="/#home"
          aria-label="BUMDESMA Podo Rukun, Beranda"
          className="flex min-w-0 shrink items-center gap-2 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:gap-3"
          onClick={() => {
            if (location.pathname === "/" && location.hash === "#home") {
              scrollToSection(document.getElementById("home"));
            }
          }}
        >
          <img
            src={bumdesmaNganjuk}
            alt="BUMDESMA Nganjuk"
            className="hidden h-8 w-8 shrink-0 object-contain sm:block sm:h-9 sm:w-9"
          />
          <img
            src={podoRukun}
            alt="Podo Rukun"
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
          />
          <span className="min-w-0 text-sm font-bold leading-tight tracking-tight text-gray-900 sm:text-base">
            BUMDESMA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex" aria-label="Navigasi Utama">
          <ul className="flex items-center gap-3 xl:gap-5">
            {PRIMARY_ITEMS.map((item) => (
              <li key={item.id}>
                <NavItem
                  item={item}
                  active={active === item.id}
                  onClick={() => handleNavClick(item)}
                />
              </li>
            ))}
            {MORE_ITEMS.length > 0 && (
              <li>
                <DesktopMoreMenu
                  key={routeKey}
                  items={MORE_ITEMS}
                  active={active}
                  onNavClick={handleNavClick}
                />
              </li>
            )}
          </ul>
        </nav>

        <MobileNavigation key={routeKey} active={active} onNavClick={handleNavClick} />
      </div>
    </header>
  );
}
