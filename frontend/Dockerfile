# Frontend React + Vite: dibangun menjadi berkas statis, lalu disajikan nginx.
#
# Konteks build harus root repositori karena npm workspaces:
#   docker build -f frontend/Dockerfile .

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Build memerlukan devDependencies (Vite, plugin React, Tailwind).
RUN npm ci --workspace frontend

COPY frontend ./frontend

RUN npm run build --workspace frontend


FROM nginx:1.27-alpine

# Konfigurasi ini menggantikan default.conf bawaan image: SPA fallback ke
# index.html sekaligus reverse proxy /api dan berkas SEO ke container API.
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
