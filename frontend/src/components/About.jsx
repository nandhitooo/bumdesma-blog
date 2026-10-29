import podorukun from "../assets/podo-rukun.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useSiteContent } from "../lib/siteContent";
import { safeHttpsUrl, safeImageUrl } from "../lib/siteContentUtils";

const About = () => {
  const { about, visionMission, sections, site } = useSiteContent();
  const profileUrl = safeHttpsUrl(about.profileUrl);
  const vision =
    typeof visionMission.vision === "string" ? visionMission.vision.trim() : "";
  const missions = Array.isArray(visionMission.missions)
    ? visionMission.missions.filter(
        (item) => typeof item === "string" && item.trim(),
      )
    : [];

  return (
    <>
    <section className="py-12 md:py-20 bg-white border-b border-gray-200 scroll-mt-18" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            {sections.about.eyebrow}
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mt-1 mb-3 break-words">
            {about.heading}
          </h2>
          <p className="text-base text-gray-600">
            {about.location}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Logo Column */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center">
              <img
                src={safeImageUrl(site.logoUrl, podorukun)}
                alt={`Logo ${site.name}`}
                className="aspect-square w-48 object-contain sm:w-56"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Copy Column */}
          <div className="lg:col-span-8 min-w-0 space-y-4 break-words text-base text-gray-600 leading-relaxed">
            {Array.isArray(about.paragraphs) &&
              about.paragraphs.map((para, index) => (
                <p
                  key={index}
                  className={
                    index === about.paragraphs.length - 1
                      ? "text-sm text-gray-500 pt-2"
                      : ""
                  }
                >
                  {para}
                </p>
              ))}

            {profileUrl && (
              <div className="pt-4">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2.5 bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span>{sections.about.profileCta}</span>
                  <i className="fa-solid fa-file-pdf text-xs" aria-hidden="true"></i>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    {(vision || missions.length > 0) && (
      <section className="scroll-mt-18 border-b border-gray-200 bg-gray-50 py-12 md:py-16" id="vision-mission">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
              {visionMission.eyebrow}
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
              {visionMission.title}
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {vision && (
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-xl text-white"
                  aria-hidden="true"
                >
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    {visionMission.visionLabel}
                  </h3>
                  <p className="mt-2 break-words text-base font-medium leading-relaxed text-gray-900 sm:text-lg">
                    {vision}
                  </p>
                </div>
              </div>
            )}

            {missions.length > 0 && (
              <div
                className={`bg-gray-50 p-6 sm:p-8 ${
                  vision ? "border-t border-gray-200" : ""
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary"
                    aria-hidden="true"
                  >
                    <i className="fa-solid fa-list-check text-sm"></i>
                  </span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    {visionMission.missionLabel}
                  </h3>
                </div>
                <ol className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {missions.map((mission, index) => (
                    <li key={index} className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="min-w-0 break-words text-sm leading-relaxed text-gray-700 sm:text-base">
                        {mission}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>
    )}
    </>
  );
};

export default About;
