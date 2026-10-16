# BUMDESMA Podo Rukun LKD

Website profil dan modul CMS BUMDESMA Podo Rukun LKD (Kecamatan Wilangan,
Kabupaten Nganjuk). Repositori ini adalah monorepo npm workspaces:

- `frontend/` — React 19 + Vite + Tailwind 4 (halaman publik dan panel admin).
- `backend/` — Express 5 API, PostgreSQL, autentikasi JWT via cookie, unggah gambar.

## Persiapan

1. Pasang dependensi dari root repositori (sekali untuk kedua workspace):

   ```bash
   npm install
   ```

2. Siapkan database PostgreSQL, lalu salin env contoh:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Isi `backend/.env` sesuai nilai lokal. File `.env` tidak boleh di-commit.

3. Terapkan migrasi dan buat user admin pertama:

   ```bash
   npm run migrate
   npm run seed
   ```

4. Jalankan API dan frontend di dua terminal:

   ```bash
   npm run server   # API di http://localhost:4000
   npm run dev      # frontend di http://localhost:5173
   ```

   Vite mem-proxy `/api` dan `/uploads` ke `http://localhost:4000`, jadi cukup
   buka alamat frontend saat pengembangan.

## Variabel lingkungan (`backend/.env`)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Koneksi PostgreSQL, mis. `postgresql://user:password@localhost:5432/nama_database`. |
| `JWT_SECRET` | ya | String acak panjang (minimal 32 karakter) untuk menandatangani token. Buat dengan `openssl rand -hex 32`. |
| `CLIENT_ORIGIN` | ya | Origin frontend yang boleh mengakses API, mis. `http://localhost:5173` (tanpa slash di akhir). |
| `PORT` | tidak | Port server Express. Default `4000`. |
| `TRUST_PROXY` | tidak | Isi bila API berada di belakang reverse proxy agar IP asli klien dipakai untuk rate limit (contoh: `1` atau `loopback`). Default nonaktif. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | tidak | Hanya dipakai `npm run seed` untuk membuat admin pertama. |

## Skrip

Dijalankan dari root repositori:

| Skrip | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan frontend Vite (mode pengembangan). |
| `npm run server` | Menjalankan API Express dengan `nodemon`. |
| `npm run migrate` | Menerapkan migrasi SQL yang belum dijalankan. |
| `npm run seed` | Membuat user admin pertama dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. |
| `npm run build` | Build frontend ke `frontend/dist`. |
| `npm run preview` | Melihat hasil build frontend secara lokal. |
| `npm run lint` | Menjalankan ESLint untuk `frontend` dan `backend`. |

## Struktur folder

```
.
├── backend/
│   ├── config/          # Pembacaan dan validasi env var
│   ├── db/              # Pool PostgreSQL, migrate, seed
│   ├── middleware/      # Auth, validasi request, error handler
│   ├── migrations/      # File SQL bernomor (hanya ditambah, tidak diubah)
│   ├── routes/          # Router Express (publik dan admin)
│   ├── services/        # Logika query yang dipakai bersama antar router
│   ├── uploads/         # Gambar hasil unggah (tidak di-commit)
│   ├── app.js           # Perakitan middleware dan route
│   └── index.js         # Titik masuk server dan graceful shutdown
├── frontend/
│   └── src/
│       ├── admin/       # Halaman panel pengelola
│       ├── assets/      # Gambar dan logo
│       ├── components/  # Komponen halaman publik
│       ├── lib/         # Helper bersama (format tanggal, dsb.)
│       ├── pages/       # Halaman publik tambahan (blog, 404)
│       ├── App.jsx      # Definisi route
│       └── main.jsx     # Titik masuk React
├── eslint.config.js
└── package.json         # Skrip root dan daftar workspace
```

## Catatan pengembangan

- Migrasi yang sudah ada di `backend/migrations/` jangan diubah; tambahkan file
  SQL baru dengan nomor berikutnya.
- Semua query database memakai parameterized query (`$1`, `$2`, ...).
- Konten artikel disanitasi di `backend/services/articles.js` sebelum disimpan.
