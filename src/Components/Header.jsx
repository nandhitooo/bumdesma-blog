import React, { useState, useEffect } from "react";
import podoRukun from "../Assets/podo-rukun.png";
import bumdesmaNganjuk from "../Assets/bumdesma-nganjuk.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Header = () => {
  const [active, setActive] = React.useState("home");

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "services", "activity", "contact"];
      const scrollPosition = window.scrollY + 150;
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

  const activeLinkStyle =
    "font-semibold md:text-lg text-green-700 cursor-pointer hover:scale-105 sm:text-sm";
  const defaultLinkStyle =
    "font-semibold md:text-lg text-gray-800 cursor-pointer hover:scale-105 hover:text-green-700 sm:text-sm";

  return (
    <div className="header bg-white shadow-md fixed w-full z-10 top-0 md:px-20 md:h-20 sm:px-4 sm:h-16">
      <div className="container mx-auto flex justify-between items-center py-4 px-6 md:flex-row sm:flex-row sm:items-start">
        <div
          className="logo flex items-center cursor-pointer md:scale-100 md:mb-5 sm:scale-75"
          onClick={() => scrollToSection("home")}
        >
          <img
            src={bumdesmaNganjuk}
            alt="BUMDESMA Nganjuk Logo"
            className="h-12 mr-4"
          />
          <img src={podoRukun} alt="Podo Rukun Logo" className="h-12" />
          <h2 className="text-2xl font-bold text-green-700 ml-4">BUMDESMA</h2>
        </div>
        <ul className="nav-links flex md:space-x-8 mt-3 sm:space-x-2">
          {["home", "about", "services", "activity", "contact"].map((id) => (
            <li
              key={id}
              className={active === id ? activeLinkStyle : defaultLinkStyle}
              onClick={() => scrollToSection(id)}
            >
              {" "}
              <span className="block mx-3 sm:hidden">
                {" "}
                <i
                  className={`text-2xl fa-solid fa-${id === "home" ? "house" : id === "about" ? "circle-info" : id === "services" ? "gear" : id === "activity" ? "calendar" : "phone"}`}
                ></i>{" "}
              </span>{" "}
              <span className="hidden sm:block">
                {" "}
                {id === "home" && "Beranda"} {id === "about" && "Tentang"}{" "}
                {id === "services" && "Layanan"}{" "}
                {id === "activity" && "Kegiatan"}{" "}
                {id === "contact" && "Kontak"}{" "}
              </span>{" "}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Header;
