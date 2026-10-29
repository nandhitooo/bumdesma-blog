import { useEffect, useRef, useState } from "react";

// Pesan state form dari panel ke iframe. Hanya dikirim ke window iframe sendiri
// dengan target origin yang sama; tidak ada data yang ditulis ke server/storage.
const CONTENT_MESSAGE = "bumdesma:preview-content";
const READY_MESSAGE = "bumdesma:preview-ready";

// Tab Konten Situs → tujuan iframe. Anchor mengikuti id section di situs publik
// (Home #home, About #about, Service #services, Contact #contact, footer #site-footer).
const TAB_TARGETS = {
  site: { path: "/", hash: "" },
  hero: { path: "/", hash: "#home" },
  about: { path: "/", hash: "#about" },
  "vision-mission": { path: "/", hash: "#vision-mission" },
  services: { path: "/", hash: "#services" },
  contact: { path: "/", hash: "#contact" },
  footer: { path: "/", hash: "#site-footer" },
};

// Halaman yang judul/teksnya diatur tab "Teks Halaman".
const PAGE_TARGETS = [
  { value: "blog", label: "Blog", path: "/blog" },
  { value: "faq", label: "FAQ", path: "/faq" },
  { value: "gallery", label: "Galeri", path: "/galeri" },
  { value: "team", label: "Pengurus", path: "/pengurus" },
  { value: "transparency", label: "Transparansi", path: "/transparansi" },
  { value: "services", label: "Layanan", path: "/layanan" },
];

const DEVICE_WIDTH = { desktop: 1280, mobile: 375 };

function targetFor(activeKey, page) {
  if (activeKey === "sections") {
    return PAGE_TARGETS.find((item) => item.value === page) || PAGE_TARGETS[0];
  }
  return TAB_TARGETS[activeKey] || TAB_TARGETS.site;
}

function srcFor(activeKey, page, reloadToken) {
  const target = targetFor(activeKey, page);
  // Token hanya untuk memaksa iframe memuat ulang saat tombol muat ulang ditekan.
  const cacheBuster = reloadToken > 0 ? `&reload=${reloadToken}` : "";
  return `${target.path}?preview=1${cacheBuster}${target.hash}`;
}

const buttonClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 motion-reduce:transition-none";

const activeButtonClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-green-700 px-3 py-2 text-sm font-bold text-white";

/**
 * Pratinjau langsung situs publik di dalam iframe same-origin.
 *
 * iframe (bukan komponen publik yang dirender ulang) dipakai karena breakpoint
 * Tailwind bergantung pada lebar viewport: hanya iframe selebar 375px yang
 * menampilkan layout mobile publik dengan akurat.
 */
export default function PreviewPanel({
  id = "site-content-preview",
  activeKey,
  activeLabel,
  forms,
  dirtyKeys = [],
  onClose,
  triggerRef,
}) {
  const [device, setDevice] = useState("desktop");
  const [page, setPage] = useState("blog");
  const [reloadToken, setReloadToken] = useState(0);
  const [readyToken, setReadyToken] = useState(0);
  const [scale, setScale] = useState(1);
  const [frameHeight, setFrameHeight] = useState(720);

  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const viewportRef = useRef(null);

  // Callback tutup dibaca lewat ref supaya effect fokus/scroll tidak dipasang
  // ulang setiap kali parent merender (onClose adalah closure baru tiap render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Fokus pindah ke panel saat dibuka, Escape menutup, scroll latar dikunci,
  // dan fokus kembali ke tombol Pratinjau saat panel ditutup.
  useEffect(() => {
    const panel = panelRef.current;
    // Simpan node tombol sekarang: saat cleanup, ref bisa sudah menunjuk lain.
    const trigger = triggerRef?.current;
    panel?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [triggerRef]);

  // Hanya pesan dari iframe pratinjau sendiri yang dipercaya.
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== READY_MESSAGE) return;
      setReadyToken((token) => token + 1);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Hitung skala agar iframe selebar viewport perangkat tetap muat di panel.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    const measure = () => {
      const targetWidth = DEVICE_WIDTH[device];
      const width = node.clientWidth;
      const nextScale = Math.min(1, width / targetWidth);
      setScale(nextScale);
      setFrameHeight(Math.max(320, node.clientHeight / nextScale));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [device]);

  // Kirim state form dengan debounce ±200 ms: bagian aktif selalu dikirim, tab
  // lain hanya bila isinya sudah berubah (belum disimpan).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const target = frameRef.current?.contentWindow;
      if (!target) return;
      const keys = [activeKey, ...dirtyKeys.filter((key) => key !== activeKey)];
      keys.forEach((key) => {
        const content = forms[key];
        if (!content) return;
        target.postMessage(
          { type: CONTENT_MESSAGE, key, content },
          window.location.origin,
        );
      });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [activeKey, dirtyKeys, forms, readyToken, reloadToken]);

  const src = srcFor(activeKey, page, reloadToken);
  const iframeTitle = `Pratinjau situs publik: ${activeLabel || "beranda"}`;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Tutup pratinjau"
        onClick={() => onCloseRef.current?.()}
        className="absolute inset-0 bg-gray-900/40 lg:hidden"
      />

      <section
        id={id}
        ref={panelRef}
        role="dialog"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-xl outline-none lg:w-[45vw] lg:min-w-[26rem] lg:border-l lg:border-gray-200"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Pratinjau
            </p>
            <h2
              id={`${id}-title`}
              className="mt-0.5 break-words text-base font-extrabold text-gray-900"
            >
              Tampilan {activeLabel || "situs"}
            </h2>
            <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              Pratinjau langsung, belum disimpan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex gap-1 rounded-xl border border-gray-200 p-1"
              role="group"
              aria-label="Lebar pratinjau"
            >
              <button
                type="button"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                className={device === "desktop" ? activeButtonClass : buttonClass}
              >
                <i className="fa-solid fa-desktop" aria-hidden="true"></i>
                Desktop
              </button>
              <button
                type="button"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                className={device === "mobile" ? activeButtonClass : buttonClass}
              >
                <i className="fa-solid fa-mobile-screen" aria-hidden="true"></i>
                Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className={buttonClass}
            >
              <i className="fa-solid fa-rotate" aria-hidden="true"></i>
              Muat ulang
            </button>

            <button
              type="button"
              onClick={() => onCloseRef.current?.()}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200 motion-reduce:transition-none"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              Tutup
            </button>
          </div>
        </header>

        {activeKey === "sections" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <label
              htmlFor={`${id}-page`}
              className="text-sm font-bold text-gray-700"
            >
              Halaman
            </label>
            <select
              id={`${id}-page`}
              value={page}
              onChange={(event) => setPage(event.target.value)}
              className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-green-700"
            >
              {PAGE_TARGETS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="min-w-0 break-words text-xs text-gray-500">
              Pratinjau mengikuti halaman yang dipilih.
            </p>
          </div>
        )}

        <div
          ref={viewportRef}
          className={`flex-1 overflow-hidden bg-gray-100 ${
            device === "mobile" ? "flex items-start justify-center p-3" : ""
          }`}
        >
          <div
            style={{
              width: DEVICE_WIDTH[device],
              height: frameHeight,
              transform: `scale(${scale})`,
              transformOrigin: device === "mobile" ? "top center" : "top left",
            }}
            className="shrink-0 bg-white shadow-sm"
          >
            <iframe
              key={src}
              ref={frameRef}
              src={src}
              title={iframeTitle}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
