import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ToastProvider, useToast } from "./components/Toast";

// Menu dikelompokkan supaya pengurus non-teknis tidak menghadapi 14 item datar.
// Item bertanda adminOnly disembunyikan sepenuhnya dari editor (bukan dikunci),
// karena editor memang tidak punya akses ke endpoint-nya.
const navigation = [
  {
    id: "ringkasan",
    label: null,
    items: [{ to: "/admin", label: "Ringkasan", icon: "gauge", end: true }],
  },
  {
    id: "konten",
    label: "Konten",
    items: [
      { to: "/admin/articles", label: "Artikel", icon: "newspaper" },
      { to: "/admin/categories", label: "Kategori", icon: "layer-group", adminOnly: true },
      { to: "/admin/gallery", label: "Galeri", icon: "images", adminOnly: true },
      { to: "/admin/documents", label: "Dokumen", icon: "file-lines", adminOnly: true },
      { to: "/admin/faqs", label: "FAQ", icon: "circle-question", adminOnly: true },
    ],
  },
  {
    id: "situs",
    label: "Situs",
    items: [
      { to: "/admin/content", label: "Konten Situs", icon: "sliders", adminOnly: true },
      { to: "/admin/service-details", label: "Detail Layanan", icon: "circle-info", adminOnly: true },
      { to: "/admin/team", label: "Pengurus", icon: "people-group", adminOnly: true },
    ],
  },
  {
    id: "sistem",
    label: "Sistem",
    items: [
      { to: "/admin/users", label: "Pengguna", icon: "users", adminOnly: true },
      { to: "/admin/backup", label: "Backup", icon: "database", adminOnly: true },
      { to: "/admin/audit", label: "Log Aktivitas", icon: "clipboard-list", adminOnly: true },
    ],
  },
  {
    id: "akun",
    label: "Akun",
    items: [
      // Keduanya terbuka untuk editor: mengurus akun sendiri.
      { to: "/admin/password", label: "Ganti Password", icon: "key" },
      { to: "/admin/two-factor", label: "Verifikasi 2 Langkah", icon: "shield-halved" },
    ],
  },
];

function AdminLayoutContent() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("loading");
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  // Panel geser disimpan bersama path halamannya, sehingga berpindah halaman
  // (termasuk tombol back/forward) otomatis menutupnya tanpa effect tambahan.
  const [menu, setMenu] = useState({ open: false, path: location.pathname });
  const menuOpen = menu.open && menu.path === location.pathname;
  const menuButtonRef = useRef(null);
  // Tujuan redirect login dibaca lewat ref supaya pemeriksaan sesi cukup sekali
  // saat panel dimuat, bukan diulang setiap kali rute berubah (yang membuat
  // kegagalan sesaat langsung mengganti seluruh panel dengan layar error).
  // `navigate` juga disimpan di ref: dengan BrowserRouter identitasnya berubah
  // setiap kali rute berganti, sehingga tidak boleh dipakai sebagai dependensi.
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
  }, [location, navigate]);

  useEffect(() => {
    let active = true;
    // Redirect sesi ditangani di sini (dengan state.from) agar tetap navigasi SPA.
    adminApi("/api/auth/me", { redirectOnUnauthorized: false })
      .then(({ user: currentUser }) => {
        if (active) {
          setUser(currentUser);
          setAuthState("ready");
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          navigateRef.current("/admin/login", {
            replace: true,
            state: { from: locationRef.current },
          });
        } else {
          setAuthState("error");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Selama panel geser terbuka: scroll body dikunci dan Escape menutupnya.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenu((current) => ({ ...current, open: false }));
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const openMenu = () => setMenu({ open: true, path: location.pathname });
  const closeMenu = () => {
    setMenu((current) => ({ ...current, open: false }));
    menuButtonRef.current?.focus();
  };
  const closeMenuQuietly = () =>
    setMenu((current) => ({ ...current, open: false }));

  const logout = async () => {
    try {
      await adminApi("/api/auth/logout", { method: "POST" });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      toast.show(error.message, "error");
    }
  };

  if (authState === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gray-50 text-gray-600">
        Memeriksa sesi...
      </main>
    );
  }

  if (authState === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
          Gagal memeriksa sesi. Periksa koneksi, lalu muat ulang halaman.
        </p>
      </main>
    );
  }

  const groups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || user.role === "admin"),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="admin-layout min-h-dvh bg-gray-50 lg:flex lg:items-start">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
        <Link
          to="/admin"
          className="min-w-0 text-base font-extrabold leading-tight text-green-900"
        >
          BUMDESMA
          <span className="mt-0.5 block text-xs font-medium text-green-700">
            Panel pengelola
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={openMenu}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          aria-label="Buka menu"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-green-900 transition-colors hover:bg-gray-50 motion-reduce:transition-none"
        >
          <i className="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh max-h-dvh w-72 max-w-[85vw] -translate-x-full flex-col overflow-y-auto overscroll-contain bg-green-900 text-white transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:h-dvh lg:max-h-dvh lg:w-72 lg:max-w-none lg:translate-x-0 lg:visible lg:shrink-0 ${
          menuOpen ? "translate-x-0" : "invisible"
        }`}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-5 lg:block lg:shrink-0 lg:px-7 lg:py-8">
          <Link
            to="/admin"
            onClick={closeMenuQuietly}
            className="min-w-0 text-lg font-extrabold leading-tight"
          >
            BUMDESMA
            <span className="mt-1 block text-xs font-medium text-green-200">
              Panel pengelola
            </span>
          </Link>
          <div className="flex items-center gap-2 lg:mt-8 lg:block">
            <div className="min-w-0 text-right text-xs text-green-100 lg:text-left">
              <p className="break-words font-bold text-white">{user.name}</p>
              <p>{user.role === "admin" ? "Admin" : "Editor"}</p>
            </div>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Tutup menu"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-green-100 hover:bg-green-800 hover:text-white lg:hidden"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <nav
          aria-label="Navigasi admin"
          className="flex-1 overflow-y-auto px-3 py-2 lg:shrink-0 lg:px-4"
        >
          {groups.map((group, index) => (
            <div key={group.id} className={index === 0 ? "" : "mt-6"}>
              {group.label && (
                <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-green-300">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={closeMenuQuietly}
                      className={({ isActive }) =>
                        `flex min-h-[44px] items-center gap-3 break-words rounded-xl px-4 py-2.5 text-sm font-bold transition motion-reduce:transition-none ${
                          isActive
                            ? "bg-white text-green-900 shadow-sm"
                            : "text-green-100 hover:bg-green-800"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <i
                            className={`fa-solid fa-${item.icon} w-5 shrink-0`}
                            aria-hidden="true"
                          ></i>
                          <span className="min-w-0 flex-1">{item.label}</span>
                          {isActive && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-green-700"
                              aria-hidden="true"
                            ></span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-green-800 px-5 py-4 lg:mx-4 lg:px-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            onClick={closeMenuQuietly}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-green-100 hover:text-white"
          >
            Lihat situs
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden="true"></i>
          </a>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold text-green-100 transition hover:bg-green-800 hover:text-white motion-reduce:transition-none"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminLayoutContent />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default AdminLayout;
