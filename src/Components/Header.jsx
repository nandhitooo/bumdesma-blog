import React, { useState, useEffect } from "react";
import podoRukun from "../Assets/podo-rukun.png";
import bumdesmaNganjuk from "../Assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ["home", "about", "services", "activity", "contact"];
      sections.forEach((Id) => {
        const section = document.getElementById(Id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActive(Id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { id: "home", label: "Beranda", icon: "house" },
    { id: "about", label: "Tentang", icon: "circle-info" },
    { id: "services", label: "Layanan", icon: "gear" },
    { id: "activity", label: "Kegiatan", icon: "calendar" },
    { id: "contact", label: "Kontak", icon: "phone" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg py-2"
          : "bg-white lg:bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center cursor-pointer"
          onClick={() => scrollToSection("home")}
        >
          <img
            src={bumdesmaNganjuk}
            alt="BUMDESMA Nganjuk"
            className="h-10 md:h-12 mr-3"
          />
          <img src={podoRukun} alt="Podo Rukun" className="h-10 md:h-12 mr-4" />
          <h2 className="text-xl md:text-2xl font-bold text-green-700">
            BUMDESMA
          </h2>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hidden lg:block">
          <ul className="flex space-x-8">
            {navItems.map((item) => (
              <li
                key={item.id}
                className="relative group cursor-pointer"
                onClick={() => scrollToSection(item.id)}
              >
                <div
                  className={`px-2 py-1 text-base font-bold transition-colors ${
                    active === item.id
                      ? "text-green-700"
                      : "text-gray-700 hover:text-green-600"
                  }`}
                >
                  <span>{item.label}</span>
                  {active === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-green-700 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-2xl text-green-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <ul className="py-4 px-6 space-y-2">
              {navItems.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                    active === item.id
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <i className={`fa-solid fa-${item.icon} w-6 text-center`}></i>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

