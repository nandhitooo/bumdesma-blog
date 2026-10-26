# BUMDESMA Podo Rukun LKD

Situs profil, blog publik, dan panel CMS untuk BUMDESMA Podo Rukun LKD — Badan
Usaha Milik Desa Bersama, Kecamatan Wilangan, Kabupaten Nganjuk, Jawa Timur.

Repositori ini adalah monorepo **npm workspaces** berisi dua aplikasi:

| Workspace | Isi | Teknologi |
| --- | --- | --- |
| `frontend/` | Situs profil, blog publik, halaman `/cms`, dan panel admin | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| `backend/` | REST API: artikel, kategori, pengguna, autentikasi, unggah gambar, konten situs, backup/pemulihan | Node.js (ESM), Express 5, PostgreSQL (`pg` 8), zod, sanitize-html, multer, archiver/yauzl, JWT dalam cookie httpOnly |

## 1. Ringkasan proyek

- **Situs profil** (`/`) — beranda, tentang, layanan unit usaha, kegiatan, dan kontak.
- **Blog publik** (`/blog`) — daftar artikel terbit dengan filter kategori, pencarian,
  dan paginasi, serta halaman detail per artikel.
- **Modul CMS** (`/cms` dan `/admin`) — pengelolaan artikel, kategori, pengguna,
  dan konten beranda melalui panel admin, termasuk editor teks, unggah gambar,
  pratinjau artikel, alur draf dan terbit, ganti password, serta backup/pemulihan.
- Konten beranda (hero, tentang, layanan, kontak, footer) dapat diubah dari panel
  `/admin/content` (khusus admin) tanpa deploy ulang; tersimpan sebagai JSONB di
  tabel `site_content` dengan nilai default di kode bila belum tersimpan.
- Semua konten artikel disimpan sebagai HTML yang sudah dibersihkan di backend
  (`backend/services/articles.js`) sebelum masuk database — termasuk HTML yang
  berasal dari berkas backup saat dipulihkan.

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
| `CLIENT_ORIGIN` | ya | Origin frontend yang diizinkan mengakses API, mis. `http://localhost:5173` (tanpa slash di akhir; wajib `https://` saat produksi). |
| `PORT` | tidak | Port server Express. Default `4000`. |
| `TRUST_PROXY` | tidak | Isi bila API berada di belakang reverse proxy agar IP asli klien dipakai untuk rate limit (`1`, `loopback`, dsb.). Default nonaktif. |
| `ADMIN_EMAIL` | tidak | Email admin pertama yang dibuat `npm run seed`; juga dipakai `npm run seed:articles` dan `npm test` untuk menentukan penulis contoh. |
| `ADMIN_PASSWORD` | tidak | Password admin pertama (dibaca `npm run seed`) dan dipakai `npm test`. |

Saat start, server memvalidasi semuanya sekaligus dan berhenti dengan daftar
masalah bila ada yang salah: `DATABASE_URL` belum diisi/masih nilai contoh/bukan
URL `postgresql://`, `JWT_SECRET` kurang dari 32 karakter atau masih nilai
contoh, `CLIENT_ORIGIN` kosong/bukan URL/trailing slash, `CLIENT_ORIGIN` bukan
`https` saat `NODE_ENV=production`, atau `TRUST_PROXY=true` saat produksi
(mempercayai `X-Forwarded-For` dari mana pun membuat IP bisa dipalsukan).

### Frontend (opsional): `frontend/.env`

Frontend tidak memerlukan env selama API berada di origin yang sama: semua
permintaan memakai path relatif (`/api/...`) yang diproksi Vite saat
development, sehingga `frontend/.env` hanya perlu dibuat bila API dipindah ke
origin lain.

```bash
cp frontend/.env.example frontend/.env
```

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | tidak | Origin API tanpa slash di akhir dan tanpa `/api`, mis. `https://api.situs.id`. Bila kosong, semua permintaan tetap relatif ke origin frontend. |

Nilai ini dibaca sekali saat build oleh `frontend/src/lib/apiUrl.js` (dipakai
`adminApi` dan seluruh `fetch` halaman publik), jadi `npm run build` ulang
perlu dijalankan setelah diubah. Bila diisi, browser memanggil origin tersebut
langsung dan proxy Vite tidak terpakai: daftarkan origin frontend di
`CLIENT_ORIGIN` backend supaya CORS mengizinkan responsnya. Cookie sesi memakai
`SameSite=Lax` (`backend/middleware/auth.js`), sehingga panel admin lintas
situs juga menuntut penyesuaian `SameSite`/`Secure` di sisi backend.

## 5. Menjalankan

Semua perintah dijalankan dari root repositori:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev:all` | Menjalankan API **dan** frontend sekaligus (`concurrently`), dengan label `[backend]`/`[frontend]`. Berhenti otomatis bila salah satu proses mati. |
| `npm run server` | Menjalankan API Express dengan `nodemon` di `http://localhost:4000`. |
| `npm run dev` | Menjalankan frontend Vite di `http://localhost:5173`. |
| `npm run migrate` | Menerapkan migrasi SQL di `backend/migrations/` yang belum dijalankan (`001_init.sql`, `002_site_content.sql`, `003_security.sql`). |
| `npm run seed` | Membuat user admin pertama dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. |
| `npm run seed:articles` | Mengisi 6 kategori dan 10 artikel contoh (8 terbit, 2 draf). Idempotent: aman dijalankan berulang kali. |
| `npm test` | Menjalankan uji keamanan backend (butuh server yang sedang berjalan, lihat bagian 10). |
| `npm run lint` | Menjalankan ESLint untuk `frontend` dan `backend`. |
| `npm run build` | Build frontend ke `frontend/dist`. |
| `npm run preview` | Menyajikan hasil build frontend secara lokal. |

Perintah `npm run migrate`, `npm run seed`, `npm run seed:articles`, `npm run
server`, dan `npm test` diteruskan ke workspace `backend`; `npm run dev`,
`npm run build`, dan `npm run preview` ke workspace `frontend`.

## 6. Akses aplikasi

Frontend pengembangan berjalan di `http://localhost:5173` dan API di
`http://localhost:4000`. Vite mem-proxy `/api` dan `/uploads` ke API, sehingga
cukup membuka alamat frontend saat mengembangkan. Bila `VITE_API_URL` diisi
(bagian 4), permintaan menuju `/api` langsung ke origin tersebut dan proxy tidak
terpakai; `/uploads` tetap relatif.

| Rute | Isi |
| --- | --- |
| `/` | Situs profil: beranda, tentang, layanan, kegiatan, kontak. |
| `/blog` | Daftar artikel terbit, lengkap dengan filter kategori dan pencarian. |
| `/blog/:slug` | Detail artikel terbit. |
| `/cms` | Landing page modul CMS, dengan tombol menuju panel. |
| `/admin/login` | Halaman masuk pengelola. |
| `/admin` | Ringkasan panel admin (butuh login). |
| `/admin/articles` | Daftar artikel untuk panel. |
| `/admin/articles/new`, `/admin/articles/:id/edit` | Editor artikel (judul, slug, ringkasan, kategori, cover, isi, pratinjau). |
| `/admin/categories` | Pengelolaan kategori (admin). |
| `/admin/users` | Pengelolaan pengguna (admin). |
| `/admin/content` | Pengelolaan konten beranda: hero, tentang, layanan, kontak, footer (admin). |
| `/admin/password` | Ganti password akun yang sedang login. |
| `/admin/backup` | Unduh backup dan pulihkan dari berkas backup (admin). |

Halaman panel menyetel `<meta name="robots" content="noindex">` selama pengguna
berada di rute `/admin`.

## 7. Peran pengguna

| Peran | Hak akses |
| --- | --- |
| **admin** | Semua fitur: mengelola seluruh artikel, menerbitkan artikel, mengelola kategori, pengguna, dan konten beranda, serta backup/pemulihan. |
| **editor** | Hanya artikel miliknya sendiri, dan hanya sebagai draf — editor tidak dapat menerbitkan artikel. Kategori, pengguna, konten beranda, dan backup menghasilkan 403. Editor tetap dapat mengganti password sendiri. |

Sesi login disimpan pada cookie `bumdesma_session` (httpOnly, `sameSite=lax`,
`secure` otomatis aktif saat `NODE_ENV=production`, `path=/`) dengan masa
berlaku 7 hari. Token JWT ditandatangani dengan algoritma HS256 yang dipatok —
token dengan algoritma lain ditolak. Setiap sesi yang terbit **sebelum**
password terakhir diubah ditolak, jadi mengganti password (oleh sendiri maupun
oleh admin lain) mengakhiri semua sesi lama.

## 8. Struktur folder

```
.
├── backend/
│   ├── config/env.js         # Pembacaan + validasi env var
│   ├── db/                   # pool.js, migrate.js, seed.js, seed-articles.js
│   ├── middleware/           # auth.js, validate.js, security.js, errorHandler.js, requestLogger.js
│   ├── migrations/           # 001_init.sql, 002_site_content.sql, 003_security.sql
│   ├── routes/               # articles.js, categories.js, siteContent.js, users.js, auth.js, upload.js, backup.js
│   ├── services/             # articles.js, siteContent.js, uploads.js, passwords.js
│   ├── test/security.test.js # Uji keamanan API (dijalankan terhadap server hidup)
│   ├── uploads/              # Gambar hasil unggah (tidak di-commit, hanya .gitkeep)
│   ├── backups/              # Snapshot pra-restore, maks 3 terbaru (tidak di-commit)
│   ├── app.js                # Perakitan middleware dan route
│   ├── index.js              # Titik masuk server, timeout, graceful shutdown
│   ├── .env.example          # Template variabel lingkungan
│   └── package.json          # Skrip dan dependensi backend
├── frontend/
│   ├── public/               # Aset statis (favicon podo-rukun.png)
│   ├── src/
│   │   ├── admin/            # Panel: AdminLayout, Dashboard, Articles, ArticleEditor,
│   │   │                     # EditorToolbar, editorFormats, Categories, Users,
│   │   │                     # SiteContent, ChangePassword, Backup, Login, api.js
│   │   ├── assets/           # Logo dan foto kegiatan
│   │   ├── components/       # Header, Footer, Home, About, Service, Activity, Contact,
│   │   │                     # ArticleView, ArticleImage, ScrollToTop, ErrorBoundary
│   │   ├── lib/              # date.js, siteContent.jsx (context), siteContentUtils.js, defaultContent.js
│   │   ├── pages/            # BlogList, BlogDetail, CmsLanding, NotFound
│   │   ├── App.jsx           # Definisi route dan lazy loading halaman
│   │   ├── index.css         # Tailwind dan token warna brand
│   │   └── main.jsx          # Titik masuk React
│   ├── index.html
│   ├── vite.config.js        # Plugin React + Tailwind dan proxy /api, /uploads
│   └── package.json          # Skrip dan dependensi frontend
├── eslint.config.js          # Konfigurasi ESLint untuk kedua workspace
└── package.json              # Skrip root dan daftar workspace
```

## 9. Ringkasan endpoint API

Rate limit per IP untuk seluruh `/api`: 1000 permintaan baca (`GET`) / 15 menit
dan 100 perubahan data (`POST`, `PUT`, `PATCH`, `DELETE`) / 15 menit. Batas
khusus dipisah agar beberapa pengelola yang berbagi satu IP kantor tidak saling
mengunci:

| Limiter | Kunci | Batas |
| --- | --- | --- |
| Login | IP | 10 percobaan **gagal** / 15 menit |
| Ganti password | pengguna | 5 percobaan **gagal** / 15 menit |
| Unggah gambar | pengguna | 30 berkas / 15 menit |
| Pratinjau artikel | pengguna | 60 permintaan / 15 menit |
| Unduh backup | pengguna | 10 unduhan / 15 menit |
| Pulihkan backup | pengguna | 5 percobaan / 15 menit |

Setiap permintaan yang mengubah data dan membawa header `Origin` selain
`CLIENT_ORIGIN` ditolak dengan status 403. Tanggapan `/api/auth/*` dan
`/api/admin/*` selalu memakai `Cache-Control: no-store`. Pratinjau artikel
(`POST /api/admin/articles/preview`) tidak menulis apa pun sehingga dikecualikan
dari limiter perubahan data.

### Publik (tanpa login)

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/health` | Status server; menjalankan `SELECT 1` dan membalas 503 bila database bermasalah. |
| `GET` | `/api/articles` | Daftar artikel **terbit** saja. Query: `page`, `limit` (maks 50, default 9), `category` (slug), `q` (pencarian). Balasan: `{ articles, page, limit, total, totalPages }`. |
| `GET` | `/api/articles/:slug` | Detail satu artikel terbit. Balasan: `{ article }`. |
| `GET` | `/api/categories` | Daftar kategori. Balasan: `{ categories }`. |
| `GET` | `/api/site-content` | Konten lengkap beranda, dengan defaults untuk bagian yang belum disimpan. Cache publik 30 detik. Balasan: `{ content: { hero, about, services, contact, footer } }`. |
| `POST` | `/api/auth/login` | Masuk, menyetel cookie `bumdesma_session`. Balasan: `{ user }`. |
| `POST` | `/api/auth/logout` | Menghapus cookie sesi (204). |
| `GET` | `/api/auth/me` | Data pengguna yang sedang login (butuh cookie). |
| `POST` | `/api/auth/change-password` | Ganti password sendiri (butuh cookie). Body: `currentPassword`, `newPassword` (min 8 karakter, maks 72 byte, harus berbeda dari yang lama). Password lama salah dibalas 400 — bukan 401 — supaya sesi tidak dianggap berakhir. Cookie baru diterbitkan untuk browser ini, sesi lain diputus. |
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
| `POST` | `/api/admin/articles/preview` | Mengembalikan HTML yang sudah disanitasi untuk pratinjau editor, tanpa menulis apa pun. Body: `{ contentHtml }`. Balasan: `{ contentHtml }`. |
| `PUT` | `/api/admin/articles/:id` | Memperbarui artikel. Balasan: `{ id }`. |
| `PATCH` | `/api/admin/articles/:id/status` | Mengubah draf/terbit. Editor hanya boleh membatalkan terbit artikelnya sendiri; menerbitkan tetap 403. Balasan: `{ id, status }`. |
| `DELETE` | `/api/admin/articles/:id` | Menghapus artikel (204). |
| `GET` | `/api/admin/categories` | Daftar kategori untuk panel (**admin**). |
| `POST` | `/api/admin/categories` | Menambah kategori (**admin**). |
| `PUT` | `/api/admin/categories/:id` | Mengubah kategori (**admin**). |
| `DELETE` | `/api/admin/categories/:id` | Menghapus kategori (**admin**). |
| `GET` | `/api/admin/site-content` | Konten beranda lengkap dan waktu pembaruan per key (**admin**). Balasan: `{ content, updatedAt }`; waktu bernilai `null` bila masih memakai default. |
| `PUT` | `/api/admin/site-content/:key` | Menyimpan satu bagian beranda (`hero`, `about`, `services`, `contact`, `footer`) sebagai teks biasa tervalidasi — nilai yang memuat `<` atau `>` ditolak; URL harus HTTPS (**admin**). Balasan: `{ key, content, updatedAt }`. |
| `DELETE` | `/api/admin/site-content/:key` | Menghapus perubahan satu bagian dan mengembalikannya ke default (**admin**, 204). |
| `GET` | `/api/admin/users` | Daftar pengguna (**admin**). |
| `POST` | `/api/admin/users` | Menambah pengguna (**admin**). |
| `PUT` | `/api/admin/users/:id` | Mengubah pengguna, termasuk mereset password — yang sekaligus memutus sesi pengguna tersebut (**admin**). |
| `DELETE` | `/api/admin/users/:id` | Menghapus pengguna (**admin**). Admin tidak dapat menghapus akunnya sendiri atau menghapus/menurunkan admin terakhir. |
| `POST` | `/api/admin/upload` | Unggah satu gambar lewat field multipart `image` (maks 2 MB, JPG/PNG/WebP). Balasan: `201 { url }` berupa `/uploads/<uuid>.<ext>`. |
| `GET` | `/api/admin/backup/download` | Mengunduh arsip backup (**admin**, lihat bagian 10). |
| `POST` | `/api/admin/backup/restore` | Memulihkan dari arsip backup (**admin**, lihat bagian 10). |

## 10. Backup dan pemulihan

Backup berisi seluruh isi situs — kategori, artikel, konten beranda, dan berkas
gambar yang benar-benar dirujuk — dalam satu arsip ZIP:

```
bumdesma-backup-YYYYMMDD-HHMMSS.zip
├── data.json          # formatVersion 1 + categories, articles, siteContent, counts, missingFiles
└── uploads/<uuid>.(jpg|png|webp)
```

`data.json` **tidak** memuat data pengguna maupun hash password. Artikel
mereferensikan penulis lewat `authorEmail`, dan gambar yang sudah hilang dari
`backend/uploads/` hanya dicatat di `missingFiles`, tidak menggagalkan backup.

Pemulihan bersifat **mengganti**: kategori, artikel, dan konten situs diganti
dengan isi backup, sedangkan akun pengguna tidak disentuh. Berkas gambar hanya
ditambah atau ditimpa, tidak pernah dihapus. Langkahnya:

1. Sebelum ada perubahan apa pun, server membuat **snapshot pra-restore** ke
   `backend/backups/` (maksimal 3 terbaru disimpan). Kegagalan membuat snapshot
   membatalkan pemulihan — lebih aman tidak memulihkan daripada memulihkan tanpa
   jalan kembali.
2. Seluruh penggantian data berjalan dalam satu transaksi PostgreSQL dengan
   advisory lock, jadi dua pemulihan tidak dapat berjalan bersamaan dan
   kegagalan di tengah proses tidak meninggalkan data setengah jadi.
3. HTML artikel dari backup selalu disanitasi ulang dengan aturan yang sama
   seperti saat artikel disimpan.
4. Berkas gambar baru disalin setelah transaksi berhasil; berkas yang gagal
   ditulis dilaporkan di `failedFiles`.

Berkas backup divalidasi sebelum dipakai: maksimal 5.000 entri, ukuran total isi
maksimal 200 MB, `data.json` maksimal 10 MB, setiap gambar maksimal 2 MB dan
isinya harus benar-benar gambar yang sesuai dengan ekstensinya, nama entri yang
menembus folder (`..`, path absolut, backslash) ditolak, dan hanya `data.json`
serta `uploads/<uuid>.<ekstensi>` yang diterima. Berkas unggahan maksimal 100 MB
dan pemulihan juga meminta password admin yang sedang login.

Catatan operasional:

- `backend/backups/` **tidak** di-commit (lihat `.gitignore`); simpan snapshot
  penting di luar repositori bila diperlukan.
- Unduh backup secara berkala sebelum perubahan besar. Pemulihan mengganti
  seluruh artikel dan kategori, jadi perubahan yang tidak ada di arsip akan
  hilang.
- Karena `backend/uploads/` menyimpan gambar sebagai berkas, folder ini harus
  ikut di-backup dan tetap persisten di produksi.

## 11. Catatan produksi dan pengembangan

**Produksi**

- Jalankan dengan `NODE_ENV=production` agar cookie sesi otomatis memakai flag
  `secure` (wajib diakses lewat HTTPS) dan pesan error tidak membocorkan detail.
- Isi `TRUST_PROXY` bila API berada di belakang reverse proxy, supaya rate limit
  memakai IP asli klien dan bukan IP proxy. Nilai `true` justru ditolak saat
  produksi.
- Folder `backend/uploads/` harus persisten (volume/disk terpisah) dan ikut
  di-backup: gambar artikel disimpan sebagai berkas, bukan di database. Berkas
  yang tidak lagi dirujuk artikel akan dibersihkan otomatis oleh API.
- Jalankan `npm run migrate` pada setiap rilis. Jangan menjalankan `npm run seed`
  ulang dengan password berbeda, dan **jangan** menjalankan `npm run seed:articles`
  di produksi (seeder menolak sendiri saat `NODE_ENV=production`; lihat bagian 3
  bila perlu memaksanya di lingkungan non-produksi).

**Pengembangan**

- Migrasi yang sudah ada di `backend/migrations/` tidak boleh diubah; perubahan
  skema selalu berupa file SQL baru dengan nomor berikutnya. Konten beranda
  disimpan oleh migrasi `002_site_content.sql`, dan kolom `password_changed_at`
  (pencabutan sesi setelah ganti password) oleh `003_security.sql`.
- Semua query database memakai parameterized query (`$1`, `$2`, ...); nilai dari
  pengguna tidak pernah dirangkai ke dalam string SQL.
- Data contoh dari `npm run seed:articles` hanya untuk pengembangan. Ganti dengan
  konten asli sebelum dipublikasikan.
- `npm run lint` mencakup kedua workspace, dan `npm run build` harus lulus sebelum
  perubahan frontend dianggap selesai.
- `npm test` menjalankan uji keamanan backend (`backend/test/security.test.js`)
  terhadap server yang sedang berjalan — jalankan `npm run server` lebih dulu.
  Uji memakai `API_URL` (default `http://localhost:4000`) dan membutuhkan
  `ADMIN_EMAIL` + `ADMIN_PASSWORD` dari `backend/.env` untuk bagian yang membuat
  artikel, mengganti password, serta mengunduh dan memulihkan backup. Tanpa
  kredensial tersebut, bagian uji yang membutuhkannya dilewati dengan pesan yang
  jelas. Semua data sementara yang dibuat uji (pengguna editor dan artikel
  berslug `zz-uji-*`) dihapus kembali setelah selesai; pemulihan backup diuji
  dengan arsip yang dibuat uji sendiri.

## 12. Header keamanan untuk hosting frontend

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
