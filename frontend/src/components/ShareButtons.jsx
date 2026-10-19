import { useEffect, useRef, useState } from "react";

// Salinan cadangan untuk browser lama / konteks non-secure: navigator.clipboard
// hanya tersedia di HTTPS (atau localhost). Textarea sementara dipakai karena
// document.execCommand("copy") menyalin dari elemen yang sedang terseleksi.
function copyWithFallback(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "-1000px";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(field);
  }
}

function ShareButtons({ title, slug }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  // Tautan bagikan memakai halaman pratinjau /share/:slug supaya gambar dan
  // ringkasannya ikut muncul saat tautan ditempel di media sosial.
  const shareUrl = `${window.location.origin}/share/${slug}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard tidak tersedia.");
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      copyWithFallback(shareUrl);
    }

    setCopied(true);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 3000);
  };

  const buttonClass =
    "inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";

  return (
    <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="bagikan-judul">
      <h2 id="bagikan-judul" className="text-sm font-bold text-gray-900">
        Bagikan artikel ini
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          <i className="fa-brands fa-whatsapp text-brand-primary" aria-hidden="true"></i>
          <span>Bagikan ke WhatsApp</span>
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          <i className="fa-brands fa-facebook text-brand-primary" aria-hidden="true"></i>
          <span>Bagikan ke Facebook</span>
        </a>
        <button type="button" onClick={copyLink} className={buttonClass}>
          <i className="fa-solid fa-link text-brand-primary" aria-hidden="true"></i>
          <span>Salin tautan</span>
        </button>
      </div>
      <p aria-live="polite" className="mt-3 text-xs font-semibold text-brand-primary">
        {copied ? "Tautan disalin" : ""}
      </p>
    </section>
  );
}

export default ShareButtons;
