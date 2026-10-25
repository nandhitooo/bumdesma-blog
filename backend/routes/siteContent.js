import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAudit } from "../services/audit.js";
import {
  getAll,
  getAllWithUpdatedAt,
  resetKey,
  SITE_CONTENT_KEYS,
  siteContentSchemas,
} from "../services/siteContent.js";

const publicRouter = express.Router();
const adminRouter = express.Router();
const keySchema = z.object({ key: z.enum(SITE_CONTENT_KEYS) });

publicRouter.get("/", async (req, res) => {
  res.set("Cache-Control", "public, max-age=30");
  return res.json({ content: await getAll() });
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res) => {
  return res.json(await getAllWithUpdatedAt());
});

adminRouter.put(
  "/:key",
  validate(keySchema, "params"),
  async (req, res) => {
    const { key } = req.validated.params;
    const parsed = siteContentSchemas[key].safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { rows } = await pool.query(
      `INSERT INTO site_content (key, content, updated_by)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE
       SET content = EXCLUDED.content,
           updated_at = now(),
           updated_by = EXCLUDED.updated_by
       RETURNING key, content, updated_at`,
      [key, JSON.stringify(parsed.data), req.user.id],
    );
    await logAudit(req, "update", "site_content", key);
    return res.json({
      key: rows[0].key,
      content: rows[0].content,
      updatedAt: rows[0].updated_at,
    });
  },
);

adminRouter.delete(
  "/:key",
  validate(keySchema, "params"),
  async (req, res) => {
    await resetKey(req.validated.params.key);
    await logAudit(req, "delete", "site_content", req.validated.params.key);
    return res.status(204).end();
  },
);

export { adminRouter };
export default publicRouter;
