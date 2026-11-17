# BUMDESMA Podo Rukun LKD

Situs resmi BUMDESMA Podo Rukun LKD (Kecamatan Wilangan, Kabupaten Nganjuk) beserta panel pengelolaannya. Repositori ini adalah monorepo npm workspaces: `frontend/` berisi aplikasi React 19 + Vite, `backend/` berisi API Express 5 + PostgreSQL.

Isi situs publik mencakup profil lembaga, unit layanan, kegiatan, galeri, transparansi dokumen, pengurus, FAQ, blog, dan formulir kontak. Semua teks halaman dikelola dari panel admin (`/admin`), bukan ditulis di dalam kode.

## Prasyarat

- Node.js 20.19+ atau 22.12+ (syarat Vite 7) dan npm 10+
- PostgreSQL 14 atau lebih baru
- Git

## Instalasi

1. Pasang seluruh dependency workspace:

   ```bash
   npm install
   ```

2. Siapkan konfigurasi backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Lalu isi `backend/.env`:

   | Variabel | Keterangan |
   | --- | --- |
   | `DATABASE_URL` | Koneksi PostgreSQL, mis. `postgresql://user:password@localhost:5432/bumdesma` |
   | `JWT_SECRET` | String acak minimal 32 karakter (`openssl rand -hex 32`) |
   | `CLIENT_ORIGIN` | Origin frontend tanpa slash di akhir, mis. `http://localhost:5173` |
   | `PUBLIC_SITE_URL` | URL publik situs untuk sitemap, feed, dan pratinjau tautan |
   | `PORT` | Port API (default `4000`) |
   | `TRUST_PROXY` | Jumlah hop reverse proxy (`1`) atau `loopback`; kosongkan bila diakses langsung |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Hanya dipakai `npm run seed` untuk membuat admin pertama |

3. Buat tabel dan data awal:

   ```bash
   npm run migrate
   npm run seed
   ```

4. Jalankan API dan frontend sekaligus:

   ```bash
   npm run dev:all
   ```

Situs dapat dibuka di `http://localhost:5173`, API di `http://localhost:4000`, dan panel pengelola di `http://localhost:5173/admin/login`.

## Daftar script

Dijalankan dari root repositori.

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Frontend Vite saja (proxy `/api` ke `http://localhost:4000`) |
| `npm run server` | API Express dengan nodemon |
| `npm run dev:all` | API dan frontend sekaligus |
| `npm run build` | Build produksi frontend ke `frontend/dist` |
| `npm run preview` | Menyajikan hasil build frontend |
| `npm run lint` | ESLint untuk `frontend` dan `backend` |
| `npm test` | Test backend (`node --test`) |
| `npm run migrate` | Menerapkan migrasi SQL yang belum dijalankan |
| `npm run seed` | Membuat user admin pertama dari `ADMIN_EMAIL`/`ADMIN_PASSWORD` |
| `npm run seed:articles` | Mengisi artikel contoh (ditolak saat produksi) |
| `npm run seed:content` | Mengisi konten situs contoh |
| `npm run reset-password` | Mengatur ulang password user |
| `npm run disable-2fa` | Mematikan verifikasi 2 langkah seorang user |

Catatan: `npm test` menjalankan test backend yang sebagian memanggil API sungguhan, jadi jalankan `npm run server` di terminal lain lebih dulu. Suite yang membutuhkan kredensial admin otomatis dilewati bila `ADMIN_EMAIL`/`ADMIN_PASSWORD` tidak tersedia.

## Struktur folder

```
.
├── backend/
│   ├── app.js              # susunan middleware, CORS, rate limit, dan pemasangan route
│   ├── index.js            # titik masuk server
│   ├── config/             # pembacaan dan validasi env
│   ├── db/                 # pool, migrate, dan seeder
│   ├── middleware/         # auth, validasi zod, keamanan, error handler
│   ├── migrations/         # migrasi SQL bernomor (jangan diubah setelah diterapkan)
│   ├── routes/             # endpoint publik dan admin
│   ├── services/           # logika bersama (artikel, konten situs, unggahan, audit)
│   ├── test/               # test node:test
│   └── uploads/            # berkas gambar unggahan (tidak masuk git)
├── frontend/
│   └── src/
│       ├── admin/          # halaman panel pengelola
│       ├── components/     # komponen publik (Header, Footer, beranda, kontak)
│       ├── pages/          # halaman publik (blog, galeri, FAQ, layanan, dll.)
│       ├── lib/            # hook dan util (konten situs, SEO, API, tanggal)
│       └── assets/         # gambar statis
└── .github/workflows/ci.yml
```

## Catatan produksi

- Jalankan dengan `NODE_ENV=production`. Pada mode ini cookie sesi memakai flag `Secure`, sehingga situs **wajib** diakses lewat HTTPS, dan pesan error tidak membocorkan detail internal.
- `PUBLIC_SITE_URL` harus domain asli (mis. `https://bumdesma.example.id`) tanpa slash di akhir. Server menolak start bila nilainya masih `localhost`/loopback, karena `sitemap.xml`, feed, dan pratinjau tautan akan mengindeks alamat lokal. Bila dibiarkan kosong, nilai efektifnya diambil dari origin pertama `CLIENT_ORIGIN` dan tetap diperiksa dengan aturan yang sama.
- `CLIENT_ORIGIN` harus origin `https://` pada produksi, dan boleh berisi beberapa origin dipisah koma (mis. domain utama dan `www`).
- `TRUST_PROXY` diisi jumlah hop (mis. `1`) atau nama subnet tepercaya (mis. `loopback`) bila API berada di belakang reverse proxy. Nilai `true` sengaja ditolak karena membuat klien bisa memalsukan IP dan melewati rate limiter.
- Jalankan `npm run migrate` pada setiap rilis. Migrasi lama tidak boleh diubah; perubahan skema selalu berupa berkas baru bernomor berikutnya.
- Folder `backend/uploads/` harus persisten (volume/disk terpisah). Gambar disimpan sebagai berkas, bukan di dalam database, sehingga folder itu perlu ikut dicadangkan bersama database.
- `npm run seed` hanya untuk membuat admin pertama. Jangan menjalankan `npm run seed:articles` di produksi; seeder itu sudah menolak sendiri saat `NODE_ENV=production`.
- Unggahan baru juga menghasilkan varian WebP 480 dan 960 piksel di folder yang sama untuk `srcset`. Berkas varian tidak dirujuk konten, jadi tidak masuk arsip backup; situs tetap tampil normal memakai berkas asli bila varian tidak ada.

## Integrasi berkelanjutan

`.github/workflows/ci.yml` menjalankan langkah berikut pada setiap push dan pull request:

1. `npm ci`
2. `npm run migrate` dan `npm run seed` ke PostgreSQL sementara (service container)
3. Menjalankan API di latar belakang, lalu menunggu `GET /api/health`
4. `npm run lint`, `npm test`, dan `npm run build`

Workflow ini memakai kredensial database dan admin sementara yang ditulis langsung di berkas workflow, bukan rahasia produksi. Jangan menyalin nilai tersebut ke server sungguhan.
