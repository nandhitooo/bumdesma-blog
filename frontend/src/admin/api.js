const LOGIN_PATH = "/api/auth/login";

// Sesi yang habis di tengah pemakaian panel: kembalikan ke halaman login alih-alih
// menampilkan pesan error di halaman admin yang sudah tidak bisa dipakai.
// Panggilan login sendiri dikecualikan supaya pesan "Email atau password salah."
// tetap tampil di formulir. Pemanggil bisa mematikan redirect ini lewat opsi
// redirectOnUnauthorized (dipakai AdminLayout yang punya alur redirect sendiri).
function redirectToLogin(path) {
  if (path === LOGIN_PATH) return;
  if (window.location.pathname.startsWith("/admin/login")) return;
  window.location.assign("/admin/login");
}

export async function adminApi(path, options = {}) {
  const { redirectOnUnauthorized = true, ...fetchOptions } = options;
  const response = await fetch(path, {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...fetchOptions.headers,
    },
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Permintaan gagal. Coba lagi.");
    error.status = response.status;
    if (response.status === 401 && redirectOnUnauthorized) {
      redirectToLogin(path);
    }
    throw error;
  }
  return data;
}

export function toSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(value, existing, currentId) {
  const base = toSlug(value) || "artikel";
  const used = new Set(
    existing
      .filter((item) => item.id !== currentId)
      .map((item) => item.slug),
  );
  let slug = base;
  let suffix = 2;
  while (used.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
