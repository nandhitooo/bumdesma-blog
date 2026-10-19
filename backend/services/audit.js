import { pool } from "../db/pool.js";

// Mencatat satu aktivitas panel admin. Best-effort: kegagalan mencatat tidak
// pernah melempar error dan tidak boleh menggagalkan aksi yang sudah berhasil,
// jadi pemanggil tidak perlu menangani kegagalan audit.
//
// `detail` hanya boleh berisi informasi non-sensitif seperti nama field yang
// diubah atau jumlah baris. JANGAN pernah mengirim password, hash, token, atau
// isi artikel/konten ke sini.
//
// `userId` dipakai untuk aksi yang belum punya req.user, mis. login berhasil.
export async function logAudit(
  req,
  action,
  entity,
  entityId = null,
  detail = {},
  userId = req?.user?.id ?? null,
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        userId ?? null,
        action,
        entity,
        entityId === null || entityId === undefined ? null : String(entityId),
        JSON.stringify(detail ?? {}),
      ],
    );
  } catch (error) {
    console.error(
      `Gagal mencatat audit ${action} ${entity}:`,
      error.message,
    );
  }
}
