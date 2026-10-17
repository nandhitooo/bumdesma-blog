import { useState } from "react";
import { adminApi } from "./api";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function AdminChangePassword() {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    // Pemeriksaan cepat di sisi klien; server tetap memvalidasi ulang.
    if (form.newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("Password baru tidak boleh sama dengan password saat ini.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      const { message } = await adminApi("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      // Sesi di browser ini sudah diperbarui lewat cookie baru dari server,
      // jadi pengguna tetap masuk setelah password diganti.
      setForm(emptyForm);
      setShowPassword(false);
      setNotice(message || "Password berhasil diubah.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const inputType = showPassword ? "text" : "password";
  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700";

  return (
    <section className="mx-auto max-w-3xl">
      <header className="mb-7">
        <p className="font-bold text-green-700">Pengaturan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
          Ganti Password
        </h1>
        <p className="mt-2 text-gray-600">
          Ubah password akun Anda sendiri. Sesi ini tetap aktif, tetapi sesi
          lama di perangkat lain akan berakhir.
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

      <form
        onSubmit={submit}
        className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <label
            htmlFor="current-password"
            className="mb-2 block font-bold text-gray-700"
          >
            Password saat ini
          </label>
          <input
            id="current-password"
            type={inputType}
            autoComplete="current-password"
            required
            value={form.currentPassword}
            onChange={(event) => setField("currentPassword", event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block font-bold text-gray-700"
          >
            Password baru
          </label>
          <input
            id="new-password"
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(event) => setField("newPassword", event.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-gray-500">
            Minimal 8 karakter. Jangan pakai password yang sama dengan layanan
            lain.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block font-bold text-gray-700"
          >
            Konfirmasi password baru
          </label>
          <input
            id="confirm-password"
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Ganti password"}
          </button>
          <button
            type="button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className="rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
          >
            {showPassword ? "Sembunyikan password" : "Tampilkan password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AdminChangePassword;
