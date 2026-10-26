import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

const TONES = {
  success: {
    box: "border-green-200 bg-white text-green-900",
    icon: "fa-circle-check text-green-700",
  },
  error: {
    box: "border-red-200 bg-white text-red-900",
    icon: "fa-circle-exclamation text-red-700",
  },
  info: {
    box: "border-gray-200 bg-white text-gray-900",
    icon: "fa-circle-info text-green-700",
  },
};

// Notifikasi singkat yang muncul di pojok bawah dan menutup sendiri. Mengganti
// window.alert supaya pesan sukses/gagal tidak memblokir pekerjaan pengguna.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, tone = "success") => {
      if (!message) return;
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list, { id, message, tone }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), 6000),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.info;
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg ${tone.box}`}
            >
              <i
                className={`fa-solid ${tone.icon} mt-0.5 shrink-0`}
                aria-hidden="true"
              ></i>
              <p className="min-w-0 flex-1 break-words text-sm font-semibold">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="-my-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  return context || { show: () => {}, dismiss: () => {} };
}
