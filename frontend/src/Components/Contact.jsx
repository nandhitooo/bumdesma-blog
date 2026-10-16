import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

const contactInfo = [
  {
    title: "Alamat Kantor",
    content:
      "Jln. Makam Syekh Sulukhi, Wilangan, Kec. Wilangan, Kabupaten Nganjuk, Jawa Timur 64462",
    icon: "fa-location-dot",
    linkText: "Buka di Google Maps",
    link: "https://maps.app.goo.gl/DRFWDQnaQ5on7btF8",
  },
  {
    title: "Surat Elektronik",
    content: "bumdesmapodorukun@gmail.com",
    icon: "fa-envelope",
    linkText: "Kirim Email",
    link: "mailto:bumdesmapodorukun@gmail.com",
  },
  {
    title: "WhatsApp Layanan",
    content: "+62 851-5616-2917",
    icon: "fa-whatsapp",
    iconBrand: true,
    linkText: "Kirim Pesan WhatsApp",
    link: "https://wa.me/6285156162917",
  },
];

const Contact = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 border-t border-gray-200" id="contact">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Kontak & Lokasi
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3">
            Hubungi Kami
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Kami siap melayani kebutuhan informasi dan konsultasi masyarakat terkait seluruh layanan dan program BUMDESMA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-4">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 flex items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                  <i
                    className={`${info.iconBrand ? "fa-brands" : "fa-solid"} ${info.icon} text-base`}
                    aria-hidden="true"
                  ></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {info.content}
                  </p>
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-dark transition-colors"
                  >
                    <span>{info.linkText}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Map Column */}
          <div className="lg:col-span-7">
            <div className="w-full h-80 sm:h-96 lg:h-[396px] bg-white border border-gray-200 rounded-xl overflow-hidden">
              <iframe
                title="Lokasi Kantor BUMDESMA Podo Rukun"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1977.577637645205!2d111.8042181!3d-7.5580429!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79cb7bd2add4c1%3A0x7ee799cc5f783f1b!2sBumdesma%20Podo%20Rukun!5e0!3m2!1sid!2sid!4v1770733882545"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
