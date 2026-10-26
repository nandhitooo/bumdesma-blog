import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ConfirmContext = createContext(null);

// Dialog konfirmasi pengganti window.confirm. Pemanggil memakai
// `const ok = await confirm({ ... })`, sehingga aksi hapus bisa menyebut nama
// item dan tombol berbahaya memakai warna merah yang konsisten.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  const close = useCallback((result) => {
    setRequest(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(result);
  }, []);

  const confirm = useCallback((options) => {
    // Permintaan baru menutup permintaan lama sebagai "batal" supaya promise
    // sebelumnya tidak menggantung tanpa jawaban.
    resolver.current?.(false);
    return new Promise((resolve) => {
      resolver.current = resolve;
      setRequest(typeof options === "string" ? { message: options } : options);
    });
  }, []);

  useEffect(() => {
    if (!request) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") close(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [request, close]);

  const value = useMemo(() => ({ confirm }), [confirm]);
  const danger = request?.tone !== "default";

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-gray-900/60 p-4 sm:items-center sm:p-6">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            aria-describedby="admin-confirm-message"
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl outline-none sm:p-7"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  danger ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
                }`}
                aria-hidden="true"
              >
                <i
                  className={`fa-solid ${
                    danger ? "fa-triangle-exclamation" : "fa-circle-question"
                  }`}
                ></i>
              </span>
              <div className="min-w-0">
                <h2
                  id="admin-confirm-title"
                  className="break-words text-lg font-extrabold text-gray-900"
                >
                  {request.title || "Konfirmasi"}
                </h2>
                <p
                  id="admin-confirm-message"
                  className="mt-2 break-words text-sm leading-relaxed text-gray-600"
                >
                  {request.message}
                </p>
                {request.detail && (
                  <p className="mt-2 break-words text-sm font-bold text-gray-900">
                    {request.detail}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="min-h-[44px] rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
              >
                {request.cancelLabel || "Batal"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`min-h-[44px] rounded-xl px-5 py-3 font-bold text-white ${
                  danger
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-green-700 hover:bg-green-800"
                }`}
              >
                {request.confirmLabel || "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext);
  return context?.confirm || (async () => false);
}
