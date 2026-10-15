# BUMDESMA Podo Rukun LKD

Repository uses two npm workspaces:

- `frontend/` — React, Vite, and public/admin pages.
- `backend/` — Express API, PostgreSQL migrations, and uploaded images.

Install dependencies from repository root with `npm install`.

Run frontend with `npm run dev`. Run API with `npm run server`.
Vite proxies `/api` and `/uploads` to `http://localhost:4000`.

Copy `backend/.env.example` to `backend/.env`, then set local PostgreSQL
connection values and a strong JWT secret. Do not commit `.env`.

Run `npm run migrate` to apply migrations and `npm run seed` to create the
first admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

Run `npm run build` to build the frontend and `npm run lint` to lint both
workspaces.
