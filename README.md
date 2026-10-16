# BUMDESMA Podo Rukun LKD

Situs profil, blog publik, dan panel CMS untuk BUMDESMA Podo Rukun LKD — Badan
Usaha Milik Desa Bersama, Kecamatan Wilangan, Kabupaten Nganjuk, Jawa Timur.

Repositori ini adalah monorepo **npm workspaces** berisi dua aplikasi:

| Workspace | Isi | Teknologi |
| --- | --- | --- |
| `frontend/` | Situs profil, blog publik, halaman `/cms`, dan panel admin | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| `backend/` | REST API: artikel, kategori, pengguna, autentikasi, unggah gambar | Node.js (ESM), Express 5, PostgreSQL (`pg` 8), zod, sanitize-html, multer, JWT dalam cookie httpOnly |

## 1. Ringkasan proyek

- **Situs profil** (`/`) — beranda, tentang, layanan unit usaha, kegiatan, dan kontak.
- **Blog publik** (`/blog`) — daftar artikel terbit dengan filter kategori, pencarian,
  dan paginasi, serta halaman detail per artikel.
- **Modul CMS** (`/cms` dan `/admin`) — pengelolaan artikel, kategori, dan pengguna
  melalui panel admin, termasuk editor teks, unggah gambar, serta alur draf dan terbit.
- Konten beranda dapat dikelola melalui API admin; panel yang dituju adalah
  `/admin/content` (admin only), tetapi rute antarmuka frontend belum tersedia.
- Semua konten artikel disimpan sebagai HTML yang sudah dibersihkan di backend
  (`backend/services/articles.js`) sebelum masuk database.

## 2. Prasyarat

- **Node.js** versi LTS beserta npm. Repositori ini tidak memakai `engines` di
  `package.json`, jadi versi tidak dipatok; pengembangan terakhir dijalankan pada
  Node 24.
- **PostgreSQL** yang bisa diakses dari mesin lokal (pengembangan terakhir diuji
  pada PostgreSQL 18). Migrasi memakai `ON CONFLICT` dan `timestamptz`.
- Git (opsional) untuk mengelola perubahan kode.

## 3. Instalasi

1. Pasang seluruh dependensi dari root repositori (sekali untuk kedua workspace):

   ```bash
   npm install
   ```

2. Buat database PostgreSQL, lalu salin env contoh:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Isi nilai di `backend/.env` sesuai lingkungan lokal (lihat tabel pada bagian 4).
   File `.env` berisi kredensial dan tidak boleh di-commit.

4. Terapkan migrasi, lalu buat user admin pertama:

   ```bash
   npm run migrate
   npm run seed
   ```

5. (Opsional) Isi contoh artikel dan kategori untuk pengembangan:

   ```bash
   npm run seed:articles
   ```

   Seeder menyalin foto kegiatan yang cocok ke `backend/uploads/` dan mengisi
   cover artikel. Saat dijalankan ulang, seeder hanya melengkapi cover kosong
   tanpa menimpa cover yang sudah dipilih editor. Perintah ini idempotent dan
   menolak berjalan bila `NODE_ENV=production` kecuali ditambah flag `--force`. Karena npm memakai
   `--force` untuk dirinya sendiri, perintah pemaksanya adalah:

   ```bash
   node backend/db/seed-articles.js --force
   ```

   Alternatif lewat npm (perhatikan `--` tambahan):

   ```bash
   npm run seed:articles -- -- --force
   ```

## 4. Variabel lingkungan (`backend/.env`)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | String koneksi PostgreSQL, mis. `postgresql://user:password@localhost:5432/nama_database`. |
| `JWT_SECRET` | ya | String acak minimal **32 karakter** untuk menandatangani token. Contoh membuat: `openssl rand -hex 32`. |
| `CLIENT_ORIGIN` | ya | Origin frontend yang diizinkan mengakses API, mis. `http://localhost:5173` (tanpa slash di akhir). |
| `PORT` | tidak | Port server Express. Default `4000`. |
| `TRUST_PROXY` | tidak | Isi bila API berada di belakang reverse proxy agar IP asli klien dipakai untuk rate limit (`1`, `loopback`, dsb.). Default nonaktif. |
| `ADMIN_EMAIL` | tidak | Email admin pertama yang dibuat `npm run seed`; juga dipakai `npm run seed:articles` untuk menentukan penulis contoh. |
| `ADMIN_PASSWORD` | tidak | Password admin pertama (hanya dibaca `npm run seed`). |

Server akan menolak start dengan pesan yang jelas bila `DATABASE_URL`,
`JWT_SECRET` (minimal 32 karakter), atau `CLIENT_ORIGIN` belum benar.

## 5. Menjalankan

Semua perintah dijalankan dari root repositori:

| Perintah | Fungsi |
| --- | --- |
| `npm run migrate` | Menerapkan migrasi SQL di `backend/migrations/` yang belum dijalankan, termasuk `002_site_content.sql`. |
| `npm run seed` | Membuat user admin pertama dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. |
| `npm run seed:articles` | Mengisi 6 kategori dan 10 artikel contoh (8 terbit, 2 draf). Idempotent: aman dijalankan berulang kali. |
| `npm run server` | Menjalankan API Express dengan `nodemon` di `http://localhost:4000`. |
| `npm run dev` | Menjalankan frontend Vite di `http://localhost:5173`. |
| `npm run build` | Build frontend ke `frontend/dist`. |
| `npm run preview` | Menyajikan hasil build frontend secara lokal. |
| `npm run lint` | Menjalankan ESLint untuk `frontend` dan `backend`. |

## 6. Akses aplikasi

Frontend pengembangan berjalan di `http://localhost:5173` dan API di
`http://localhost:4000`. Vite mem-proxy `/api` dan `/uploads` ke API, sehingga
cukup membuka alamat frontend saat mengembangkan.

| Rute | Isi |
| --- | --- |
| `/` | Situs profil: beranda, tentang, layanan, kegiatan, kontak. |
| `/blog` | Daftar artikel terbit, lengkap dengan filter kategori dan pencarian. |
| `/blog/:slug` | Detail artikel terbit. |
| `/cms` | Landing page modul CMS, dengan tombol menuju panel. |
| `/admin/login` | Halaman masuk pengelola. |
| `/admin` | Ringkasan panel admin (butuh login). |
| `/admin/articles`, `/admin/categories`, `/admin/users` | Pengelolaan artikel, kategori, dan pengguna. |

## 7. Peran pengguna

| Peran | Hak akses |
| --- | --- |
| **admin** | Semua fitur: mengelola seluruh artikel, menerbitkan artikel, serta mengelola kategori dan pengguna. |
| **editor** | Hanya artikel miliknya sendiri, dan hanya sebagai draf — editor tidak dapat menerbitkan artikel. Menu kategori dan pengguna tidak tersedia. |

Sesi login disimpan pada cookie `bumdesma_session` (httpOnly, `sameSite=lax`,
`secure` otomatis aktif saat `NODE_ENV=production`) dengan masa berlaku 7 hari.

## 8. Struktur folder

```
.
├── backend/
│   ├── config/              # Pembacaan env var (config/env.js)
│   ├── db/                  # Pool PostgreSQL, migrate.js, seed.js, seed-articles.js
│   ├── middleware/          # auth.js, validate.js, errorHandler.js, requestLogger.js
│   ├── migrations/          # File SQL bernomor (001_init.sql, 002_site_content.sql)
│   ├── routes/              # articles.js, categories.js, siteContent.js, users.js, auth.js, upload.js
│   ├── services/            # articles.js, siteContent.js, uploads.js
│   ├── uploads/             # Gambar hasil unggah (tidak di-commit, hanya .gitkeep)
│   ├── app.js               # Perakitan middleware dan route
│   ├── index.js             # Titik masuk server, timeout, graceful shutdown
│   ├── .env.example         # Template variabel lingkungan
│   └── package.json         # Skrip dan dependensi backend
├── frontend/
│   ├── public/              # Aset statis (favicon podo-rukun.png)
│   ├── src/
│   │   ├── admin/           # Panel pengelola (Dashboard, Articles, Categories, Users, Login)
│   │   ├── assets/          # Logo dan foto kegiatan
│   │   ├── components/      # Komponen halaman publik (Header, Home, About, dst.)
│   │   ├── lib/             # Helper bersama (format tanggal)
│   │   ├── pages/           # BlogList, BlogDetail, CmsLanding, NotFound
│   │   ├── App.jsx          # Definisi route dan lazy loading halaman
│   │   ├── index.css        # Tailwind dan token warna brand
│   │   └── main.jsx         # Titik masuk React
│   ├── index.html
│   ├── vite.config.js       # Plugin React + Tailwind dan proxy /api, /uploads
│   └── package.json         # Skrip dan dependensi frontend
├── eslint.config.js         # Konfigurasi ESLint untuk kedua workspace
└── package.json             # Skrip root dan daftar workspace
```

## 9. Ringkasan endpoint API

Rate limit per IP untuk seluruh `/api`: 1000 permintaan baca (`GET`) / 15 menit dan
100 perubahan data (`POST`, `PUT`, `PATCH`, `DELETE`) / 15 menit. Endpoint login
punya batas tambahan 10 percobaan **gagal** / 15 menit per IP, dan unggah gambar
dibatasi 30 berkas / 15 menit per pengguna. Setiap permintaan yang mengubah data
dan membawa header `Origin` selain `CLIENT_ORIGIN` ditolak dengan status 403.
Tanggapan `/api/auth/*` dan `/api/admin/*` selalu memakai `Cache-Control: no-store`.
Sesi juga berakhir otomatis setelah password pengguna diubah.

### Publik (tanpa login)

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/health` | Status server; menjalankan `SELECT 1` dan membalas 503 bila database bermasalah. |
| `GET` | `/api/articles` | Daftar artikel **terbit** saja. Query: `page`, `limit` (maks 50), `category` (slug), `q` (pencarian). Balasan: `{ articles, page, limit, total, totalPages }`. |
| `GET` | `/api/articles/:slug` | Detail satu artikel terbit. Balasan: `{ article }`. |
| `GET` | `/api/categories` | Daftar kategori. Balasan: `{ categories }`. |
| `GET` | `/api/site-content` | Konten lengkap beranda, dengan defaults untuk bagian yang belum disimpan. Cache publik 30 detik. Balasan: `{ content: { hero, about, services, contact, footer } }`. |
| `POST` | `/api/auth/login` | Masuk, menyetel cookie `bumdesma_session`. Balasan: `{ user }`. |
| `POST` | `/api/auth/logout` | Menghapus cookie sesi (204). |
| `GET` | `/api/auth/me` | Data pengguna yang sedang login (butuh cookie). |
| `GET` | `/uploads/<nama-file>` | Berkas gambar hasil unggah. |

### Admin (wajib cookie login)

Semua endpoint di bawah `/api/admin` memerlukan sesi login. Endpoint bertanda
**admin** hanya dapat diakses peran `admin`; endpoint artikel dapat diakses
`admin` dan `editor` (editor hanya untuk artikelnya sendiri).

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/admin/articles?status=all\|draft\|published&limit=200` | Daftar artikel untuk panel, `limit` maks 500 (default 200). Balasan: `{ articles }`. |
| `GET` | `/api/admin/articles/:id` | Detail artikel beserta `contentHtml` dan `status`. Balasan: `{ article }`. |
| `POST` | `/api/admin/articles` | Membuat artikel. Balasan: `201 { id }`. |
| `PUT` | `/api/admin/articles/:id` | Memperbarui artikel. Balasan: `{ id }`. |
| `PATCH` | `/api/admin/articles/:id/status` | Mengubah draf/terbit (khusus admin). Balasan: `{ id, status }`. |
| `DELETE` | `/api/admin/articles/:id` | Menghapus artikel (204). |
| `GET` | `/api/admin/categories` | Daftar kategori untuk panel (**admin**). |
| `POST` | `/api/admin/categories` | Menambah kategori (**admin**). |
| `PUT` | `/api/admin/categories/:id` | Mengubah kategori (**admin**). |
| `DELETE` | `/api/admin/categories/:id` | Menghapus kategori (**admin**). |
| `GET` | `/api/admin/site-content` | Konten beranda lengkap dan waktu pembaruan per key (**admin**). Balasan: `{ content, updatedAt }`; waktu bernilai `null` bila masih memakai default. |
| `PUT` | `/api/admin/site-content/:key` | Menyimpan satu bagian beranda (`hero`, `about`, `services`, `contact`, atau `footer`) sebagai teks biasa tervalidasi (**admin**). Balasan: `{ key, content, updatedAt }`. |
| `DELETE` | `/api/admin/site-content/:key` | Menghapus perubahan satu bagian dan mengembalikannya ke default (**admin**, 204). |
| `GET` | `/api/admin/users` | Daftar pengguna (**admin**). |
| `POST` | `/api/admin/users` | Menambah pengguna (**admin**). |
| `PUT` | `/api/admin/users/:id` | Mengubah pengguna (**admin**). |
| `DELETE` | `/api/admin/users/:id` | Menghapus pengguna (**admin**). |
| `POST` | `/api/admin/upload` | Unggah satu gambar lewat field multipart `image`. Balasan: `201 { url }` berupa `/uploads/<uuid>.<ext>`. |

## 10. Catatan produksi dan pengembangan

**Produksi**

- Jalankan dengan `NODE_ENV=production` agar cookie sesi otomatis memakai flag
  `secure` (wajib diakses lewat HTTPS) dan pesan error tidak membocorkan detail.
- Isi `TRUST_PROXY` bila API berada di belakang reverse proxy, supaya rate limit
  memakai IP asli klien dan bukan IP proxy.
- Folder `backend/uploads/` harus persisten (volume/disk terpisah) dan ikut
  di-backup: gambar artikel disimpan sebagai berkas, bukan di database. Berkas
  yang tidak lagi dirujuk artikel akan dibersihkan otomatis oleh API.
- Jalankan `npm run migrate` pada setiap rilis. Jangan jalankan `npm run seed`
  ulang dengan password berbeda, dan **jangan** menjalankan `npm run seed:articles`
  di produksi (seeder menolak sendiri saat `NODE_ENV=production`; lihat bagian 3
  bila perlu memaksanya di lingkungan non-produksi).

**Pengembangan**

- Migrasi yang sudah ada di `backend/migrations/` tidak boleh diubah; perubahan
  skema selalu berupa file SQL baru dengan nomor berikutnya. Konten beranda
  disimpan oleh migrasi `002_site_content.sql`.
- Semua query database memakai parameterized query (`$1`, `$2`, ...); nilai dari
  pengguna tidak pernah dirangkai ke dalam string SQL.
- Data contoh dari `npm run seed:articles` hanya untuk pengembangan. Ganti dengan
  konten asli sebelum dipublikasikan.
- `npm run lint` mencakup kedua workspace, dan `npm run build` harus lulus sebelum
  perubahan frontend dianggap selesai.
- `npm test` menjalankan uji keamanan backend (`backend/test/security.test.js`)
  terhadap server yang sedang berjalan. Uji memakai `API_URL` (default
  `http://localhost:4000`) dan membutuhkan `ADMIN_EMAIL` + `ADMIN_PASSWORD` dari
  `backend/.env` untuk membuat artikel serta pengguna editor sementara, yang
  dihapus lagi setelah uji selesai. Tanpa kredensial tersebut, bagian uji yang
  membutuhkannya dilewati dengan pesan yang jelas.

## 11. Header keamanan untuk hosting frontend

API mengirim header keamanannya sendiri lewat `helmet` (termasuk
`X-Content-Type-Options: nosniff`, CSP bawaan, dan `Referrer-Policy: no-referrer`).
Berkas gambar di `/uploads` dikirim ulang dengan `nosniff`, CSP `default-src 'none'`,
dan cache 7 hari.

Server yang menyajikan hasil `npm run build` (Nginx, Caddy, Vercel, dsb.) perlu
menambahkan header berikut. Daftarnya mengikuti pihak ketiga yang benar-benar
dipakai frontend: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`),
embed Google Maps (`www.google.com`), serta `/api` dan `/uploads` di origin yang sama.

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
```

Catatan:

- `style-src` memakai `'unsafe-inline'` karena Swiper dan Framer Motion menulis
  atribut `style` langsung di elemen.
- `frame-src https://www.google.com` hanya diperlukan selama peta di bagian
  Kontak dipakai (`mapsEmbedUrl`); peta itu juga dirender dengan atribut
  `sandbox` sehingga tidak dapat menavigasi halaman induk.
- `connect-src 'self'` sudah mencakup `/api` dan `/uploads` karena dilayani dari
  origin yang sama. Bila API dipindah ke subdomain lain, tambahkan origin itu.
- Halaman panel menyetel `<meta name="robots" content="noindex">` selama `/admin`
  terbuka, dan `frame-ancestors 'none'` mencegah situs ini dibingkai situs lain.
- Header di atas adalah konfigurasi server statis, bukan sesuatu yang dikirim
  aplikasi Express; verifikasi ulang setiap kali ada pihak ketiga baru dipakai.
