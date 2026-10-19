import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";

const EMPTY_FORM = {
  name: "",
  position: "",
  termLabel: "",
  sortOrder: "0",
  photoUrl: "",
};

function AdminTeam() {
  const { user } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInput = useRef(null);

  useEffect(() => {
    // Editor tanpa hak akses tidak memanggil endpoint admin sama sekali,
    // sehingga tidak ada kedipan pesan 403 sebelum layar penolakan muncul.
    if (user.role !== "admin") return undefined;

    let active = true;
    adminApi("/api/admin/team")
      .then(({ members: rows }) => {
        if (active) {
          setMembers(rows);
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
  }, [refreshKey, user.role]);

  if (user.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Pengelolaan pengurus hanya tersedia untuk admin.
      </p>
    );
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const result = await adminApi("/api/admin/upload", {
      method: "POST",
      body: data,
    });
    return result.url;
  };

  const pickPhoto = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      setField("photoUrl", await uploadImage(file));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = editingId
        ? `/api/admin/team/${editingId}`
        : "/api/admin/team";
      await adminApi(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name,
          position: form.position,
          termLabel: form.termLabel,
          sortOrder: form.sortOrder,
          photoUrl: form.photoUrl || null,
        }),
      });
      resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (member) => {
    setForm({
      name: member.name,
      position: member.position,
      termLabel: member.termLabel || "",
      sortOrder: String(member.sortOrder),
      photoUrl: member.photoUrl || "",
    });
    setEditingId(member.id);
    setError("");
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`Hapus pengurus “${member.name}”?`)) return;
    setError("");
    try {
      await adminApi(`/api/admin/team/${member.id}`, { method: "DELETE" });
      if (editingId === member.id) resetForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-7">
        <p className="font-bold text-green-700">Konten</p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Pengurus</h1>
        <p className="mt-2 text-gray-600">
          Atur susunan pengurus yang tampil di halaman publik Pengurus, termasuk
          urutan tampilnya.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mb-7 grid gap-5 rounded-3xl bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7"
      >
        <div className="sm:col-span-2">
          <span className="mb-2 block font-bold text-gray-700">Foto</span>
          <div className="mb-3 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt="Pratinjau foto pengurus"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-green-700">
                <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
              </div>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pickPhoto}
            className="sr-only"
            aria-label="Unggah foto pengurus"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="rounded-xl bg-green-50 px-4 py-3 font-bold text-green-800 hover:bg-green-100 disabled:opacity-60"
            >
              {uploading ? "Mengunggah..." : "Pilih foto"}
            </button>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => setField("photoUrl", "")}
                className="rounded-xl px-4 py-3 font-bold text-red-700 hover:bg-red-50"
              >
                Hapus pilihan
              </button>
            )}
            <span className="text-sm text-gray-500">
              JPG, PNG, WebP. Maksimal 2 MB.
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="team-name"
            className="mb-2 block font-bold text-gray-700"
          >
            Nama
          </label>
          <input
            id="team-name"
            required
            maxLength={150}
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        <div>
          <label
            htmlFor="team-position"
            className="mb-2 block font-bold text-gray-700"
          >
            Jabatan
          </label>
          <input
            id="team-position"
            required
            maxLength={150}
            value={form.position}
            onChange={(event) => setField("position", event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        <div>
          <label
            htmlFor="team-term"
            className="mb-2 block font-bold text-gray-700"
          >
            Masa bakti
          </label>
          <input
            id="team-term"
            maxLength={50}
            placeholder="mis. 2023–2028"
            value={form.termLabel}
            onChange={(event) => setField("termLabel", event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        <div>
          <label
            htmlFor="team-sort"
            className="mb-2 block font-bold text-gray-700"
          >
            Urutan
          </label>
          <input
            id="team-sort"
            type="number"
            min={0}
            max={9999}
            step={1}
            value={form.sortOrder}
            onChange={(event) => setField("sortOrder", event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
          />
          <p className="mt-1 text-xs text-gray-500">
            Angka kecil tampil lebih dulu.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan perubahan"
                : "Tambah pengurus"}
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
          <p className="p-10 text-center text-gray-500">Memuat pengurus...</p>
        ) : members.length ? (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-7"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={`Foto ${member.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl text-green-700">
                      <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900">{member.name}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {member.position}
                    {member.termLabel ? ` • ${member.termLabel}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Urutan: {member.sortOrder}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(member)}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMember(member)}
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-gray-500">Belum ada pengurus.</p>
        )}
      </div>
    </section>
  );
}

export default AdminTeam;
