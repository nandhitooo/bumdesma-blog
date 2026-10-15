import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { motion } from "framer-motion";

const Contact = () => {
  const contactInfo = [
    {
      title: "Alamat",
      content:
        "Jln. Makam Syekh Sulukhi, Wilangan, Kec. Wilangan, Kabupaten Nganjuk, Jawa Timur 64462",
      icon: "fa-location-dot",
      linkText: "Lihat di Google Maps",
      link: "https://maps.app.goo.gl/DRFWDQnaQ5on7btF8",
    },
    {
      title: "Email",
      content: "bumdesmapodorukun@gmail.com",
      icon: "fa-envelope",
      linkText: "Kirim Email",
      link: "mailto:bumdesmapodorukun@gmail.com",
    },
    {
      title: "Whatsapp",
      content: "+62 851-5616-2917",
      icon: "fa-whatsapp",
      linkText: "Chat via Whatsapp",
      link: "https://wa.me/6285156162917",
    },
  ];

  return (
    <section className="pt-24 pb-20 bg-white" id="contact">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
            Hubungi <span className="text-green-700">Kami</span>
          </h2>
          <div className="w-24 h-1.5 bg-green-700 mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami siap melayani dan menjawab pertanyaan Anda. Jangan ragu untuk
            menghubungi kami.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 space-y-6"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                whileHover={{ x: 10 }}
                className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start gap-6 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <i
                    className={`fa-solid ${info.icon} text-2xl text-green-700`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {info.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {info.content}
                  </p>
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-700 font-bold hover:text-green-800 transition group"
                  >
                    <span>{info.linkText}</span>
                    <i className="fa-solid fa-arrow-right ml-2 text-sm group-hover:translate-x-1 transition-transform"></i>
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="w-full h-[500px] overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-gray-50 relative">
              <iframe
                title="Lokasi Bumdesma Podo Rukun"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1977.577637645205!2d111.8042181!3d-7.5580429!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79cb7bd2add4c1%3A0x7ee799cc5f783f1b!2sBumdesma%20Podo%20Rukun!5e0!3m2!1sid!2sid!4v1770733882545"
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
