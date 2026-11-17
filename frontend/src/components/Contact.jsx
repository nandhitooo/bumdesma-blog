import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { apiUrl } from "../lib/apiUrl";
import { useSiteContent } from "../lib/siteContent";
import { safeWaLink, safeMailto, safeHttpsUrl } from "../lib/siteContentUtils";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "", website: "" };

const FIELD_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors motion-reduce:transition-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30";

const Contact = () => {
  const { contact, sections } = useSiteContent();
  const labels = sections.contact;
  const [form, setForm] = useState(EMPTY_FORM);
  // idle saat belum dikirim, sending selama menunggu server, lalu success/error
  // untuk menentukan pesan mana yang tampil di bawah formulir.
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setFeedback("");
    try {
      const response = await fetch(apiUrl("/api/messages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Pesan belum bisa dikirim. Coba lagi.");
      }
      setStatus("success");
      setFeedback(data.message || "Pesan Anda sudah kami terima.");
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setStatus("error");
      setFeedback(submitError.message);
    }
  };

  const contactCards = [
    {
      title: labels.addressTitle,
      content: contact.address,
      icon: "location-dot",
      linkText: labels.addressCta,
      link: safeHttpsUrl(contact.mapsLink),
      isBrand: false,
    },
    {
      title: labels.emailTitle,
      content: contact.email,
      icon: "envelope",
      linkText: labels.emailCta,
      link: safeMailto(contact.email),
      isBrand: false,
    },
    {
      title: labels.whatsappTitle,
      content: contact.whatsappDisplay || contact.whatsapp,
      icon: "whatsapp",
      linkText: labels.whatsappCta,
      link: safeWaLink(contact.whatsapp),
      isBrand: true,
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-white border-b border-gray-200 scroll-mt-18" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            {labels.eyebrow}
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mt-1 mb-3 break-words">
            {labels.title}
          </h2>
          <p className="text-base text-gray-600">
            {labels.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-4">
            {contactCards.map((info, index) => (
              <div
                key={index}
                className="min-w-0 bg-gray-50 p-5 sm:p-6 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4 hover:border-gray-300 transition-colors motion-reduce:transition-none"
              >
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                  <i
                    className={`${info.isBrand ? "fa-brands" : "fa-solid"} fa-${info.icon} text-base`}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1 break-words">
                    {info.title}
                  </h3>
                  <p className="mb-3 break-words text-sm leading-relaxed text-gray-600">
                    {info.content}
                  </p>
                  {info.link && (
                    <a
                      href={info.link}
                      target={info.link.startsWith("https://") ? "_blank" : undefined}
                      rel={info.link.startsWith("https://") ? "noopener noreferrer" : undefined}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-primary transition-colors motion-reduce:transition-none hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
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
            <div className="w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-100">
              {safeHttpsUrl(contact.mapsEmbedUrl).startsWith("https://www.google.com/maps/embed") && (
                <iframe
                  title="Lokasi Kantor BUMDESMA Podo Rukun"
                  src={safeHttpsUrl(contact.mapsEmbedUrl)}
                  className="w-full aspect-[4/3] sm:aspect-video border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>

        {/* Formulir pesan: satu-satunya jalur tulis publik di halaman ini. */}
        <form
          onSubmit={submit}
          className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:p-7"
          noValidate
        >
          <h3 className="text-lg font-bold text-gray-900">Kirim Pesan</h3>
          <p className="mt-1 text-sm text-gray-600">
            Isi formulir berikut. Pengurus akan membalas lewat email atau nomor
            telepon yang Anda cantumkan.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Nama
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={form.name}
                onChange={setField("name")}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                maxLength={150}
                autoComplete="email"
                value={form.email}
                onChange={setField("email")}
                className={FIELD_CLASS}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="contact-phone"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Nomor Telepon <span className="font-normal text-gray-500">(opsional)</span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                maxLength={30}
                autoComplete="tel"
                value={form.phone}
                onChange={setField("phone")}
                className={FIELD_CLASS}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Pesan
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                value={form.message}
                onChange={setField("message")}
                className={FIELD_CLASS}
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Minimal 10 karakter, maksimal 2000 karakter.
              </p>
            </div>
          </div>

          {/* Jebakan bot: tidak terlihat dan dilewati keyboard maupun pembaca
              layar, tetapi tetap terisi oleh pengisi formulir otomatis. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={setField("website")}
            />
          </div>

          {feedback && (
            <p
              role={status === "error" ? "alert" : "status"}
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-800"
              }`}
            >
              {feedback}
            </p>
          )}

          <div className="mt-5">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" && (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              )}
              {status === "sending" ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Contact;
