import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi, dateFormatter } from "./api";

const newUser = { name: "", email: "", password: "", role: "editor" };

function AdminUsers() {
  const { user: currentUser } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(newUser);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi("/api/admin/users")
      .then(({ users: rows }) => {
        if (active) {
          setUsers(rows);
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (currentUser.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Pengelolaan pengguna hanya tersedia untuk admin.
      </p>
    );
  }

  const resetForm = () => {
    setForm(newUser);
    setEditingId(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form };
    if (editingId && !payload.password) delete payload.password;

    try {
      await adminApi(
        editingId ? `/api/admin/users/${editingId}` : "/api/admin/users",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setError("");
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Hapus pengguna ${user.name}?`)) return;
    setError("");
    try {
      await adminApi(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7">
        <p className="font-bold text-green-700">Pengaturan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Pengguna</h1>
        <p className="mt-2 text-gray-600">Kelola akun admin dan editor.</p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mb-7 grid gap-4 rounded-3xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:p-7">
        <div>
          <label htmlFor="user-name" className="mb-2 block font-bold text-gray-700">Nama</label>
          <input
            id="user-name"
            required
            maxLength={150}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label htmlFor="user-email" className="mb-2 block font-bold text-gray-700">Email</label>
          <input
            id="user-email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label htmlFor="user-password" className="mb-2 block font-bold text-gray-700">
            {editingId ? "Kata sandi baru (opsional)" : "Kata sandi"}
          </label>
          <input
            id="user-password"
            type="password"
            autoComplete="new-password"
            required={!editingId}
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>
        <div>
          <label htmlFor="user-role" className="mb-2 block font-bold text-gray-700">Peran</label>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-700"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 lg:col-span-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Tambah pengguna"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Memuat pengguna...</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="mt-1 break-all text-sm text-gray-600">{user.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {user.role === "admin" ? "Admin" : "Editor"}
                    {" · "}
                    Bergabung {dateFormatter.format(new Date(user.createdAt))}
                    {user.id === currentUser.id && " · Anda"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    disabled={user.id === currentUser.id}
                    onClick={() => deleteUser(user)}
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default AdminUsers;
