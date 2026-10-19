import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "./api";

const navigation = [
  { to: "/admin", label: "Ringkasan", icon: "gauge", end: true },
  { to: "/admin/articles", label: "Artikel", icon: "newspaper" },
  { to: "/admin/gallery", label: "Galeri", icon: "images", adminOnly: true },
  { to: "/admin/documents", label: "Dokumen", icon: "file-lines", adminOnly: true },
  { to: "/admin/team", label: "Pengurus", icon: "people-group", adminOnly: true },
  { to: "/admin/categories", label: "Kategori", icon: "layer-group", adminOnly: true },
  { to: "/admin/users", label: "Pengguna", icon: "users", adminOnly: true },
  { to: "/admin/content", label: "Konten Situs", icon: "sliders", adminOnly: true },
  { to: "/admin/backup", label: "Backup", icon: "database", adminOnly: true },
  // Terbuka untuk admin maupun editor: setiap pengguna boleh mengganti
  // password-nya sendiri.
  { to: "/admin/password", label: "Ganti Password", icon: "key" },
];

function AdminLayout() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("loading");
  const location = useLocation();
  const navigate = useNavigate();
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

  const logout = async () => {
    try {
      await adminApi("/api/auth/logout", { method: "POST" });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      window.alert(error.message);
    }
  };

  if (authState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Memeriksa sesi...
      </main>
    );
  }

  if (authState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
          Gagal memeriksa sesi. Periksa koneksi, lalu muat ulang halaman.
        </p>
      </main>
    );
  }

  return (
    <div className="admin-layout min-h-screen bg-gray-50 lg:flex lg:items-start">
      <aside className="bg-green-900 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block lg:shrink-0 lg:px-7 lg:py-8">
          <Link to="/admin" className="text-lg font-extrabold leading-tight">
            BUMDESMA
            <span className="mt-1 block text-xs font-medium text-green-200">
              Panel pengelola
            </span>
          </Link>
          <div className="text-right text-xs text-green-100 lg:mt-8 lg:text-left">
            <p className="font-bold text-white">{user.name}</p>
            <p>{user.role === "admin" ? "Admin" : "Editor"}</p>
          </div>
        </div>

        <nav
          aria-label="Navigasi admin"
          className="overflow-x-auto px-3 pb-4 lg:shrink-0 lg:px-4"
        >
          <ul className="flex gap-2 lg:flex-col">
            {navigation
              .filter((item) => !item.adminOnly || user.role === "admin")
              .map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${
                        isActive
                          ? "bg-white text-green-900"
                          : "text-green-100 hover:bg-green-800"
                      }`
                    }
                  >
                    <i className={`fa-solid fa-${item.icon} w-5`} aria-hidden="true"></i>
                    {item.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between border-t border-green-800 px-5 py-4 lg:mx-4 lg:mt-auto lg:shrink-0 lg:px-0">
          <Link to="/" className="text-sm font-semibold text-green-100 hover:text-white">
            Lihat situs
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-2 text-sm font-bold text-green-100 transition hover:bg-green-800 hover:text-white"
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

export default AdminLayout;
