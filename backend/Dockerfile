# API Express 5 + PostgreSQL.
#
# Konteks build harus root repositori (bukan backend/) karena dependency
# dikelola npm workspaces:
#   docker build -f backend/Dockerfile .
#
# Debian dipilih, bukan Alpine: sharp dan bcrypt memakai binary native yang
# diunduh npm, dan varian glibc tersedia tanpa perlu build tool tambahan.
FROM node:22-bookworm-slim

ENV NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

# Manifest disalin lebih dulu supaya layer "npm ci" tetap dipakai selama
# lockfile tidak berubah. frontend/package.json ikut disalin karena npm membaca
# seluruh daftar workspaces, walaupun dependency frontend tidak dipasang.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Hanya dependency runtime backend (nodemon, test, dan ESLint tidak ikut).
RUN npm ci --omit=dev --workspace backend && npm cache clean --force

COPY backend ./backend

# Folder runtime dijadikan titik mount volume. Dibuat lebih dulu agar
# kepemilikannya benar saat volume pertama kali diinisialisasi Docker.
RUN chmod +x backend/docker-entrypoint.sh \
    && mkdir -p backend/uploads backend/backups \
    && chown -R node:node /app

WORKDIR /app/backend

# Proses tidak berjalan sebagai root: kerentanan di aplikasi tidak otomatis
# menjadi akses root di dalam container.
USER node

ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
CMD ["node", "index.js"]
