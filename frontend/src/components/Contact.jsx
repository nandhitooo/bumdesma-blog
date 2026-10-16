import "@fortawesome/fontawesome-free/css/all.min.css";
import { useSiteContent } from "../lib/siteContent";
import { safeWaLink, safeMailto, safeHttpsUrl } from "../lib/siteContentUtils";

const Contact = () => {
  const { contact } = useSiteContent();

  const contactCards = [
    {
      title: "Alamat Kantor",
      content: contact.address,
      icon: "location-dot",
      linkText: "Buka di Google Maps",
      link: safeHttpsUrl(contact.mapsLink),
      isBrand: false,
    },
    {
      title: "Surat Elektronik",
      content: contact.email,
      icon: "envelope",
      linkText: "Kirim Email",
      link: safeMailto(contact.email),
      isBrand: false,
    },
    {
      title: "WhatsApp Layanan",
      content: contact.whatsappDisplay || contact.whatsapp,
      icon: "whatsapp",
      linkText: "Kirim Pesan WhatsApp",
      link: safeWaLink(contact.whatsapp),
      isBrand: true,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gray-50 border-t border-gray-200 scroll-mt-18" id="contact">
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
            {contactCards.map((info, index) => (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 flex items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                  <i
                    className={`${info.isBrand ? "fa-brands" : "fa-solid"} fa-${info.icon} text-base`}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {info.title}
                  </h3>
                  <p                   className="mb-3 break-words text-sm leading-relaxed text-gray-600">
                    {info.content}
                  </p>
                  {info.link && (
                    <a
                      href={info.link}
                      target={info.link.startsWith("https://") ? "_blank" : undefined}
                      rel={info.link.startsWith("https://") ? "noopener noreferrer" : undefined}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded text-xs font-semibold text-brand-primary transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span>{info.linkText}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Map Column */}
          <div className="lg:col-span-7">
            <div className="w-full h-[280px] sm:h-[340px] lg:h-[420px] bg-white border border-gray-200 rounded-xl overflow-hidden">
              {safeHttpsUrl(contact.mapsEmbedUrl).startsWith("https://www.google.com/maps/embed") && (
                <iframe
                  title="Lokasi Kantor BUMDESMA Podo Rukun"
                  src={safeHttpsUrl(contact.mapsEmbedUrl)}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  // Sandbox: peta tetap berjalan, tetapi tidak boleh menavigasi
                  // halaman induk, membuka popup tanpa izin, atau menjalankan
                  // plugin/unduhan.
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
