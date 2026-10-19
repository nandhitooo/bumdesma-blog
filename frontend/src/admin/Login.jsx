import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "./api";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // true setelah server menjawab bahwa akun ini memakai verifikasi dua langkah.
  // Kolom kode baru ditampilkan setelah itu, sehingga pengguna tanpa 2FA tidak
  // melihat langkah tambahan apa pun.
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await adminApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(
          requiresTotp ? { email, password, code } : { email, password },
        ),
      });
      if (data?.requiresTotp) {
        setRequiresTotp(true);
        return;
      }
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-900 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <Link to="/" className="text-sm font-bold text-green-700 hover:text-green-900">
          <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true"></i>
          Kembali ke situs
        </Link>
        <p className="mt-8 font-bold uppercase tracking-[0.18em] text-green-700">
          BUMDESMA Podo Rukun
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Masuk ke panel
        </h1>
        <p className="mt-2 text-gray-600">Masuk untuk mengelola artikel dan informasi.</p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-2 block font-bold text-gray-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block font-bold text-gray-700">
              Kata sandi
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
            />
          </div>
          {requiresTotp && (
            <div>
              <label htmlFor="login-code" className="mb-2 block font-bold text-gray-700">
                Kode verifikasi
              </label>
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 tracking-[0.4em] outline-none focus:border-green-700"
              />
              <p className="mt-2 text-sm text-gray-500">
                Masukkan 6 digit dari aplikasi authenticator Anda.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {submitting ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;
