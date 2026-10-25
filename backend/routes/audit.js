import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

// Dipasang di /api/admin/audit-logs. Seluruh endpoint hanya untuk admin.
const router = express.Router();

router.use(requireAdmin);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/", validate(listQuerySchema, "query"), async (req, res) => {
  const { page, limit } = req.validated.query;
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    "SELECT count(*)::int AS total FROM audit_logs",
  );

  const { rows } = await pool.query(
    `SELECT l.id, l.action, l.entity, l.entity_id AS "entityId", l.detail,
            l.created_at AS "createdAt", u.name AS "userName"
     FROM audit_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const total = countResult.rows[0].total;

  return res.json({
    logs: rows,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
