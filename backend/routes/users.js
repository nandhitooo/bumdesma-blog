import bcrypt from "bcrypt";
import express from "express";
import { z } from "zod";
import { BCRYPT_ROUNDS } from "../config/env.js";
import { pool } from "../db/pool.js";
import { publicUser, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Format email tidak valid."));
const userSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(150),
  email: emailSchema,
  password: z.string().min(8, "Password minimal 8 karakter.").max(200),
  role: z.enum(["admin", "editor"]),
});
const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  email: emailSchema.optional(),
  password: z.string().min(8, "Password minimal 8 karakter.").max(200).optional(),
  role: z.enum(["admin", "editor"]).optional(),
});

router.use(requireAdmin);

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC",
  );
  return res.json({ users: rows.map(publicUser) });
});

router.post("/", validate(userSchema), async (req, res) => {
  const { name, email, password, role } = req.validated.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role],
  );
  return res.status(201).json({ user: publicUser(rows[0]) });
});

router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateUserSchema),
  async (req, res) => {
    const id = req.validated.params.id;
    const fields = req.validated.body;
    if (!Object.keys(fields).length) {
      return res.status(400).json({ message: "Tidak ada perubahan pengguna." });
    }
    if (id === req.user.id && fields.role === "editor") {
      return res.status(400).json({ message: "Admin tidak dapat mengubah perannya sendiri." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: adminRows } = await client.query(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE",
      );
      const { rows: targetRows } = await client.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1 FOR UPDATE",
        [id],
      );
      const target = targetRows[0];
      if (!target) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }
      if (
        target.role === "admin" &&
        fields.role === "editor" &&
        adminRows.length <= 1
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Tidak dapat menghapus admin terakhir." });
      }

      const updates = [];
      const values = [];
      for (const [field, value] of Object.entries(fields)) {
        if (field === "password") {
          values.push(await bcrypt.hash(value, BCRYPT_ROUNDS));
          updates.push(`password_hash = $${values.length}`);
        } else {
          const column = field === "name" ? "name" : field;
          values.push(value);
          updates.push(`${column} = $${values.length}`);
        }
      }
      values.push(id);
      const { rows } = await client.query(
        `UPDATE users SET ${updates.join(", ")}
         WHERE id = $${values.length}
         RETURNING id, name, email, role, created_at`,
        values,
      );
      await client.query("COMMIT");
      return res.json({ user: publicUser(rows[0]) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

router.delete(
  "/:id",
  validate(idSchema, "params"),
  async (req, res) => {
    const id = req.validated.params.id;
    if (id === req.user.id) {
      return res.status(400).json({ message: "Admin tidak dapat menghapus akunnya sendiri." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: adminRows } = await client.query(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE",
      );
      const { rows: targetRows } = await client.query(
        "SELECT role FROM users WHERE id = $1 FOR UPDATE",
        [id],
      );
      const target = targetRows[0];
      if (!target) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }
      if (target.role === "admin" && adminRows.length <= 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Tidak dapat menghapus admin terakhir." });
      }

      await client.query("DELETE FROM users WHERE id = $1", [id]);
      await client.query("COMMIT");
      return res.status(204).end();
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
);

export default router;
