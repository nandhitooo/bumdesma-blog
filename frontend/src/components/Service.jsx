import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link } from "react-router-dom";
import { useSiteContent } from "../lib/siteContent";
import { isValidIcon } from "../lib/siteContentUtils";

const Service = () => {
  const { services } = useSiteContent();
  const items = Array.isArray(services?.items) ? services.items : [];

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-gray-50 border-t border-gray-200 scroll-mt-18" id="services">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Unit Usaha
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3 break-words">
            Layanan Kami
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Berbagai layanan profesional untuk mendukung pertumbuhan ekonomi dan kemandirian masyarakat desa.
          </p>
        </div>

        {/* Max 3 columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((service, index) => {
            const hasValidIcon = isValidIcon(service.icon);
            return (
              <div
                key={index}
                className="min-w-0 bg-white p-6 sm:p-7 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors motion-reduce:transition-none flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary mb-5">
                    {hasValidIcon ? (
                      <i className={`fa-solid fa-${service.icon} text-lg`} aria-hidden="true"></i>
                    ) : (
                      <i className="fa-solid fa-gear text-lg" aria-hidden="true"></i>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 break-words">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed break-words">
                    {service.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <Link
            to="/layanan"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-primary transition-colors motion-reduce:transition-none hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <span>Lihat syarat dan alur pengajuan</span>
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Service;
