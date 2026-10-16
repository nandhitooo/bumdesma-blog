import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import podoRukun from "../Assets/podo-rukun.png";
import bumdesmaNganjuk from "../Assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Header = () => {
  const [active, setActive] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname !== "/") {
        return;
      }
      const sections = ["home", "about", "services", "activity", "contact"];
      sections.forEach((id) => {
        const section = document.getElementById(id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActive(id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const navItems = [
    { id: "home", label: "Beranda", icon: "house" },
    { id: "about", label: "Tentang", icon: "circle-info" },
    { id: "services", label: "Layanan", icon: "gear" },
    { id: "activity", label: "Kegiatan", icon: "calendar" },
    { id: "contact", label: "Kontak", icon: "phone" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center h-18">
        <Link
          to="/#home"
          className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md p-1"
          onClick={() => {
            if (location.pathname === "/") scrollToSection("home");
          }}
        >
          <img
            src={bumdesmaNganjuk}
            alt="BUMDESMA Nganjuk"
            className="h-9 w-auto"
          />
          <img src={podoRukun} alt="Podo Rukun" className="h-9 w-auto" />
          <span className="text-lg md:text-xl font-bold tracking-tight text-gray-900">
            BUMDESMA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:block" aria-label="Navigasi Utama">
          <ul className="flex items-center space-x-7">
            {navItems.map((item) => {
              const isActive = location.pathname === "/" && active === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`py-1 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                      isActive
                        ? "text-brand-primary font-semibold border-brand-primary"
                        : "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
            <li key="blog">
              <Link
                to="/blog"
                className={`py-1 text-sm font-medium transition-colors border-b-2 ${
                  location.pathname.startsWith("/blog")
                    ? "text-brand-primary font-semibold border-brand-primary"
                    : "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                }`}
              >
                Blog
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          aria-label={isOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={isOpen}
          className="lg:hidden text-xl text-gray-700 hover:text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <ul className="py-3 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === "/" && active === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-brand-light text-brand-primary font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <i className={`fa-solid fa-${item.icon} w-5 text-center text-gray-500`}></i>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <Link
                to="/blog"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/blog")
                    ? "bg-brand-light text-brand-primary font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <i className="fa-solid fa-newspaper w-5 text-center text-gray-500"></i>
                <span>Blog</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
