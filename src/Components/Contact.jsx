import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Contact = () => {
  return (
    <section className="pt-24 pb-16 bg-gray-100" id="contact">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">
          Kontak Kami
        </h2>

        <p className="text-center max-w-2xl mx-auto mb-12 text-gray-700">
          Jika Anda memiliki pertanyaan atau ingin mengetahui lebih lanjut
          tentang layanan kami, silakan hubungi kami melalui informasi berikut.
        </p>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 grid gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Alamat</h3>
              <p className="text-gray-700">
                Jl. Wilis, Wilangan, Kec. Wilangan, Kabupaten Nganjuk, Jawa
                Timur 64462
              </p>
              <div className="mt-3">
                <i className="fa-solid fa-location-dot mr-2 text-green-700"></i>
                <a
                  href="https://maps.app.goo.gl/DRFWDQnaQ5on7btF8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  Lihat di Google Maps
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Email</h3>
              <p className="text-gray-700">info@example.com</p>
              <div className="mt-3">
                <i className="fa-solid fa-envelope mr-2 text-green-700"></i>
                <a
                  href="mailto:info@bumdesma-podorukun.com"
                  className="text-blue-700 hover:underline"
                >
                  Kirim Email
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Whatsapp</h3>
              <p className="text-gray-700">+62 812-3456-7890</p>
              <div className="mt-3">
                <i className="fa-brands fa-whatsapp mr-2 text-green-700"></i>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  Chat via Whatsapp
                </a>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="w-full h-64 md:h-[500px] overflow-hidden rounded-2xl shadow-md">
              <iframe
                title="Lokasi Bumdesma Podo Rukun"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1977.577637645205!2d111.8042181!3d-7.5580429!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79cb7bd2add4c1%3A0x7ee799cc5f783f1b!2sBumdesma%20Podo%20Rukun!5e0!3m2!1sid!2sid!4v1770733882545"
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
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
