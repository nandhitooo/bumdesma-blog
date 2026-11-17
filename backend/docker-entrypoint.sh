#!/bin/sh
# Titik masuk container API: siapkan database, lalu jalankan server.
set -e

# Migrasi selalu dijalankan lebih dulu. Server menolak start bila tabel inti
# belum ada, dan migrasi aman diulang karena schema_migrations mencatat berkas
# yang sudah diterapkan.
node db/migrate.js

# Admin pertama hanya dibuat bila kredensialnya diberikan (mis. lewat .env root
# untuk docker compose). Seed bersifat idempotent: user yang sudah ada tidak
# ditimpa, jadi aman dijalankan pada setiap start.
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  node db/seed.js
fi

exec "$@"
