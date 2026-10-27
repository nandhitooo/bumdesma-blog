import { useEffect, useRef } from "react";

// Modal umum untuk formulir ubah data. Menutup dengan Esc, klik latar, atau
// tombol silang; mengunci scroll halaman di belakangnya dan memindahkan fokus
// ke kolom isian pertama supaya admin bisa langsung mengetik.
function Modal({ title, error, onClose, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const firstField = panelRef.current?.querySelector(
      "input:not([type=hidden]):not([type=file]), textarea, select",
    );
    (firstField || panelRef.current)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-gray-900/60 p-3 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl outline-none sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="admin-modal-title"
            className="break-words text-xl font-extrabold text-gray-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            aria-label="Tutup"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}

export default Modal;
