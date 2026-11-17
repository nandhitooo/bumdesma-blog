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

## Menjalankan dengan Docker

Repositori ini menyertakan `docker-compose.yml` berisi tiga service: PostgreSQL, API Express, dan frontend nginx.

1. Build dan jalankan seluruh stack:

   ```bash
   docker compose up --build -d
   ```

2. Buka `http://localhost:8080`. Berkas statis dan endpoint `/api`, `/uploads`, `/sitemap.xml`, serta `/feed.xml` dilayani dari origin yang sama, sehingga tidak ada pengaturan CORS tambahan.

3. Buat admin pertama (sekali saja). Entrypoint container menjalankan migrasi otomatis, tetapi admin hanya dibuat bila kredensialnya diberikan:

   ```bash
   docker compose exec -e ADMIN_EMAIL=admin@example.com \
     -e ADMIN_PASSWORD='PasswordKuat123' backend node db/seed.js
   ```

   Nilai yang sama bisa ditulis di `.env` root sebagai `ADMIN_EMAIL` dan `ADMIN_PASSWORD`; container akan menjalankannya saat start (seed tidak menimpa user yang sudah ada).

Perintah lain yang sering dipakai:

| Perintah | Fungsi |
| --- | --- |
| `docker compose logs -f backend` | Melihat log API |
| `docker compose exec db psql -U bumdesma -d bumdesma` | Masuk ke PostgreSQL |
| `docker compose down` | Menghentikan container (data tetap ada) |
| `docker compose down -v` | Menghentikan dan **menghapus** database, unggahan, serta backup |

Nilai berikut bisa ditimpa lewat `.env` di root atau variabel lingkungan:

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `FRONTEND_PORT` | `8080` | Port host untuk situs |
| `JWT_SECRET` | secret pengembangan | Ganti dengan string acak minimal 32 karakter |
| `CLIENT_ORIGIN` | `http://localhost:<FRONTEND_PORT>` | Origin yang diizinkan mengakses API |
| `PUBLIC_SITE_URL` | `http://localhost:<FRONTEND_PORT>` | URL publik untuk sitemap dan feed |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `bumdesma` | Kredensial database internal |
| `NODE_ENV` | `development` | Isi `production` hanya bila situs diakses lewat HTTPS |
| `TRUST_PROXY` | `1` | Jumlah reverse proxy di depan API |

Hanya port frontend yang dibuka ke host. API dan PostgreSQL berada di jaringan internal compose; port `4000` di host tidak dipakai sehingga tidak bentrok dengan server pengembangan lokal.

Data yang bertahan ada di tiga volume bernama: `db-data`, `uploads`, dan `backups`.

### Profil produksi (Caddy + TLS)

`docker-compose.prod.yml` menimpa compose dasar untuk produksi: API berjalan dengan `NODE_ENV=production`, port frontend ditutup dari host, dan service `caddy` mengurus sertifikat HTTPS otomatis (ACME) di port 80 dan 443.

Langkah lengkap dari DNS sampai verifikasi ada di bagian [Deploy ke server](#deploy-ke-server); perintah singkatnya:

```bash
DOMAIN=bumdesma.example.id \
ACME_EMAIL=admin@example.id \
PUBLIC_SITE_URL=https://bumdesma.example.id \
CLIENT_ORIGIN=https://bumdesma.example.id \
JWT_SECRET="$(openssl rand -hex 32)" \
POSTGRES_PASSWORD="$(openssl rand -hex 16)" \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Syarat dan catatan:

- Domain harus sudah mengarah (A/AAAA) ke server dan port 80 serta 443 terbuka; Caddy memakai port 80 untuk verifikasi sertifikat.
- `PUBLIC_SITE_URL` dan `CLIENT_ORIGIN` wajib `https://` dan berisi domain asli. API menolak start bila URL publiknya masih host lokal.
- `TRUST_PROXY=2` karena ada dua hop di depan API (Caddy, lalu nginx frontend), sehingga rate limit tetap memakai IP klien asli.
- Caddy mengalihkan `www.<domain>` ke domain utama dengan 308 dan memasang CSP bersama HSTS, `nosniff`, serta `Referrer-Policy`. CSP mengizinkan Google Fonts, peta Google Maps, iframe pratinjau admin yang same-origin, dan JSON-LD inline; aset build tetap dibatasi ke origin sendiri. Bila `www` tidak dipakai, hapus blok `www.{$DOMAIN}` pada `Caddyfile` agar Caddy tidak mencoba menerbitkan sertifikat untuk nama itu.
- Sertifikat disimpan di volume `caddy-data` dan `caddy-config` agar tidak diminta ulang setiap container dibuat ulang.
- `POSTGRES_PASSWORD` hanya berlaku saat volume database pertama kali dibuat. Mengubahnya setelah data ada tidak mengubah password user di dalam PostgreSQL.
- Tag `!reset` pada berkas override membutuhkan Docker Compose 2.24 atau lebih baru.
- Untuk mencoba alur TLS tanpa domain asli, tambahkan `local_certs` pada blok global `Caddyfile`; sertifikat yang dipakai kalau begitu berasal dari CA lokal Caddy.

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
├── docker-compose.yml
├── docker-compose.prod.yml
├── Caddyfile
├── .dockerignore
├── frontend/Dockerfile
├── frontend/nginx.conf
├── backend/Dockerfile
├── backend/docker-entrypoint.sh
├── scripts/cek-deploy.sh   # pemeriksaan DNS, port, env, dan sertifikat
└── .github/workflows/ci.yml
```

## Deploy ke server

Urutan lengkap untuk server baru. Semua perintah dijalankan di server, dari akar repo.

**1. Arahkan domain lebih dulu.** Buat catatan `A` untuk `DOMAIN` (dan `www` bila dipakai) berisi IP publik server. Bila server punya IPv6, buat juga catatan `AAAA`; kalau tidak, jangan membuat `AAAA` sama sekali agar browser tidak mencoba alamat yang tak terjangkau. Periksa dari komputer lain:

```bash
dig +short A bumdesma.example.id
dig +short AAAA bumdesma.example.id
```

**2. Buka port 80 dan 443.** Port 80 tetap diperlukan Caddy untuk verifikasi sertifikat dan mengalihkan ke https. Port 443/udp hanya untuk HTTP/3 (opsional). Contoh untuk ufw:

```bash
ufw allow 80,443/tcp
ufw allow 443/udp   # opsional
```

Bila ada firewall jaringan atau security group di depan server, buka port yang sama di sana.

**3. Pasang Docker Engine dan plugin Compose** (versi Compose 2.24 atau lebih baru karena profil produksi memakai `!reset`).

**4. Siapkan berkas `.env`** di akar repo, lalu batasi izinnya:

```bash
cat > .env <<'EOF'
DOMAIN=bumdesma.example.id
ACME_EMAIL=admin@example.id
PUBLIC_SITE_URL=https://bumdesma.example.id
CLIENT_ORIGIN=https://bumdesma.example.id
JWT_SECRET=ganti-dengan-openssl-rand-hex-32
POSTGRES_PASSWORD=ganti-dengan-openssl-rand-hex-16
ADMIN_EMAIL=admin@example.id
ADMIN_PASSWORD=ganti-password-admin
EOF
chmod 600 .env
```

`ADMIN_EMAIL` dan `ADMIN_PASSWORD` hanya dipakai saat start pertama untuk membuat admin; setelah itu boleh dihapus dari `.env`.

**5. Jalankan pemeriksaan pra-deploy.** Skrip ini tidak mengubah apa pun, hanya membaca DNS, port, env, dan kapasitas disk:

```bash
bash scripts/cek-deploy.sh
```

Semua baris harus `OK`. `GAGAL` berarti deploy akan bermasalah; `PERIKSA` berarti perlu keputusan manual (misalnya catatan `AAAA` yang mengarah ke alamat yang belum siap). Bila deteksi IP publik keliru (server di belakang NAT), jalankan `SERVER_IP=<ip-publik> bash scripts/cek-deploy.sh`.

**6. Nyalakan stack produksi:**

```bash
DOMAIN=bumdesma.example.id \
ACME_EMAIL=admin@example.id \
PUBLIC_SITE_URL=https://bumdesma.example.id \
CLIENT_ORIGIN=https://bumdesma.example.id \
JWT_SECRET=... POSTGRES_PASSWORD=... \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Nilai variabel bisa dibaca dari `.env` pada langkah 4, sehingga perintahnya cukup satu baris. Penerbitan sertifikat biasanya selesai dalam hitungan detik sampai satu menit; pantau dengan `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy`.

**7. Verifikasi dari luar.** Setelah stack hidup, jalankan mode verifikasi yang memeriksa endpoint, sitemap, penerbit sertifikat, header keamanan, dan pengalihan http ke https:

```bash
bash scripts/cek-deploy.sh --setelah
```

Bila sertifikat masih dari CA lokal atau `PERIKSA` muncul pada penerbit, berarti ACME belum berhasil — periksa kembali DNS dan port 80.

**8. Rilis berikutnya.** Tarik kode baru lalu build ulang; migrasi berjalan otomatis lewat entrypoint:

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Cadangkan volume `db-data` dan `uploads` secara berkala, jangan hanya database-nya: gambar disimpan di volume terpisah.

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
