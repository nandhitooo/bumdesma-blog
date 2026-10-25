import podorukun from "../assets/podo-rukun.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useSiteContent } from "../lib/siteContent";
import { safeHttpsUrl } from "../lib/siteContentUtils";

const About = () => {
  const { about } = useSiteContent();
  const profileUrl = safeHttpsUrl(about.profileUrl);
  const vision = typeof about.vision === "string" ? about.vision.trim() : "";
  const missions = Array.isArray(about.missions)
    ? about.missions.filter((item) => typeof item === "string" && item.trim())
    : [];

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-white scroll-mt-18" id="about">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Tentang BUMDESMA
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3 break-words">
            {about.heading}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {about.location}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Logo Column */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-xs p-8 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
              <img
                src={podorukun}
                alt="Logo BUMDESMA Podo Rukun"
                className="aspect-square w-48 object-contain sm:w-56"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Copy Column */}
          <div className="lg:col-span-8 min-w-0 space-y-5 break-words text-sm sm:text-base text-gray-700 leading-relaxed">
            {Array.isArray(about.paragraphs) &&
              about.paragraphs.map((para, index) => (
                <p
                  key={index}
                  className={
                    index === about.paragraphs.length - 1
                      ? "text-sm text-gray-500"
                      : ""
                  }
                >
                  {para}
                </p>
              ))}

            {profileUrl && (
              <div className="pt-2">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2.5 bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span>Unduh Dokumen Profil Resmi</span>
                  <i className="fa-solid fa-file-pdf text-xs" aria-hidden="true"></i>
                </a>
              </div>
            )}
          </div>
        </div>

        {(vision || missions.length > 0) && (
          <div className="mt-14 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-12">
            <div className="mb-8 max-w-3xl">
              <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
                Arah Lembaga
              </span>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
                Visi &amp; Misi
              </h3>
            </div>

            {vision && (
              <div className="flex flex-col gap-4 rounded-2xl bg-brand-primary p-6 text-white sm:flex-row sm:items-start sm:gap-6 sm:p-8">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl"
                  aria-hidden="true"
                >
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Visi
                  </h4>
                  <p className="mt-2 break-words text-base font-medium leading-relaxed sm:text-lg lg:text-xl">
                    {vision}
                  </p>
                </div>
              </div>
            )}

            {missions.length > 0 && (
              <div className={vision ? "mt-8" : ""}>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Misi
                </h4>
                <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {missions.map((mission, index) => (
                    <li
                      key={index}
                      className="flex min-w-0 items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
                        {index + 1}
                      </span>
                      <p className="min-w-0 break-words pt-1 text-sm leading-relaxed text-gray-700 sm:text-base">
                        {mission}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default About;

