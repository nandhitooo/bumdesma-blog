import { useEffect, useState } from "react";
import { adminApi } from "./api";

const emptyDisableForm = { password: "", code: "" };

function AdminTwoFactor() {
  const [status, setStatus] = useState("loading");
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableForm, setDisableForm] = useState(emptyDisableForm);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    adminApi("/api/auth/me", { redirectOnUnauthorized: false })
      .then(({ user }) => {
        if (!active) return;
        setEnabled(Boolean(user.totpEnabled));
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          setStatus("ready");
          setError("Sesi tidak valid. Muat ulang halaman lalu masuk kembali.");
        } else {
          setStatus("error");
          setError(requestError.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const startSetup = async () => {
    setError("");
    setNotice("");
    setStarting(true);
    try {
      const data = await adminApi("/api/auth/2fa/setup", { method: "POST" });
      setSetup(data);
      setEnableCode("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStarting(false);
    }
  };

  const enable = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const data = await adminApi("/api/auth/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ code: enableCode }),
      });
      setEnabled(Boolean(data.totpEnabled));
      setSetup(null);
      setEnableCode("");
      setNotice(data.message || "Verifikasi dua langkah berhasil diaktifkan.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const disable = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const data = await adminApi("/api/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify(disableForm),
      });
      setEnabled(Boolean(data.totpEnabled));
      setDisableForm(emptyDisableForm);
      setSetup(null);
      setNotice(data.message || "Verifikasi dua langkah berhasil dinonaktifkan.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700";

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-8">
      <header className="mb-7">
        <p className="font-bold text-green-700">Pengaturan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
          Verifikasi Dua Langkah
        </h1>
        <p className="mt-2 text-gray-600">
          Setelah aktif, login membutuhkan kode 6 digit dari aplikasi
          authenticator di samping password.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-green-800">
          {notice}
        </p>
      )}

      {status === "loading" && (
        <p className="rounded-3xl bg-white p-5 text-gray-600 shadow-sm sm:p-7">
          Memeriksa status...
        </p>
      )}

      {status === "ready" && (
        <div className="space-y-5">
          <p className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            Status:{" "}
            <strong className={enabled ? "text-green-700" : "text-gray-700"}>
              {enabled ? "Aktif" : "Belum aktif"}
            </strong>
          </p>

          {!enabled && !setup && (
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <p className="text-gray-600">
                Aktifkan untuk menambah lapisan keamanan pada akun Anda.
              </p>
              <button
                type="button"
                onClick={startSetup}
                disabled={starting}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
              >
                {starting ? "Menyiapkan..." : "Aktifkan verifikasi dua langkah"}
              </button>
            </div>
          )}

          {!enabled && setup && (
            <form
              onSubmit={enable}
              className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-7"
            >
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Masukkan secret ke aplikasi authenticator
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Tambahkan akun secara manual, atau salin URL otpauth berikut
                  ke aplikasi yang mendukungnya.
                </p>
              </div>

              <div>
                <p className="mb-2 font-bold text-gray-700">Secret</p>
                <p className="break-all rounded-xl bg-gray-50 p-4 font-mono text-sm text-gray-800">
                  {setup.secret}
                </p>
              </div>

              <div>
                <p className="mb-2 font-bold text-gray-700">URL otpauth</p>
                <p className="break-all rounded-xl bg-gray-50 p-4 font-mono text-xs text-gray-800">
                  {setup.otpauthUrl}
                </p>
              </div>

              <div>
                <label htmlFor="enable-code" className="mb-2 block font-bold text-gray-700">
                  Kode verifikasi
                </label>
                <input
                  id="enable-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={enableCode}
                  onChange={(event) =>
                    setEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className={`${inputClass} tracking-[0.4em]`}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Masukkan kode yang tampil di aplikasi untuk memastikan secret
                  sudah benar.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Memverifikasi..." : "Aktifkan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetup(null);
                    setEnableCode("");
                    setError("");
                  }}
                  className="min-h-[44px] w-full rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200 sm:w-auto"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {enabled && (
            <form
              onSubmit={disable}
              className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-7"
            >
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Nonaktifkan verifikasi dua langkah
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Masukkan password dan kode authenticator saat ini.
                </p>
              </div>

              <div>
                <label htmlFor="disable-password" className="mb-2 block font-bold text-gray-700">
                  Password
                </label>
                <input
                  id="disable-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={disableForm.password}
                  onChange={(event) =>
                    setDisableForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="disable-code" className="mb-2 block font-bold text-gray-700">
                  Kode verifikasi
                </label>
                <input
                  id="disable-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={disableForm.code}
                  onChange={(event) =>
                    setDisableForm((current) => ({
                      ...current,
                      code: event.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  placeholder="123456"
                  className={`${inputClass} tracking-[0.4em]`}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Menonaktifkan..." : "Nonaktifkan"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminTwoFactor;
