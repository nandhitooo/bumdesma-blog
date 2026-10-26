import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "./ConfirmDialog";

// Peringatan saat meninggalkan halaman dengan perubahan belum disimpan:
// - menutup/memuat ulang tab memakai dialog bawaan browser (beforeunload),
// - navigasi di dalam panel ditahan dan dikonfirmasi lewat ConfirmDialog.
// Aplikasi memakai BrowserRouter (bukan data router), jadi klik tautan internal
// dicegat pada fase capture sebelum React Router memprosesnya.
export function useUnsavedChangesGuard(isDirty, message) {
  const confirm = useConfirm();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      confirm({
        title: "Perubahan belum disimpan",
        message,
        confirmLabel: "Tinggalkan halaman",
        cancelLabel: "Tetap di sini",
      }).then((leave) => {
        if (leave) navigate(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, message, confirm, navigate]);
}

export default useUnsavedChangesGuard;
