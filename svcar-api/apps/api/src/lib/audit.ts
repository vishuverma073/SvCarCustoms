import type { DbClient } from "../db/client.js";
import { auditLog } from "../db/schema.js";

export interface AuditEntry {
  /** null for system actions. */
  actorUserId: string | null;
  /** e.g. "product.update", "admin.login.success". */
  action: string;
  resourceType: "product" | "category" | "order" | "home_config" | "settings" | "user" | "upload";
  /** stringified id of the affected resource. */
  resourceId: string;
  changes?: { before?: unknown; after?: unknown };
}

/**
 * Write an audit log row. Fire-and-forget: an audit failure must never block
 * business logic, so errors are logged and swallowed rather than thrown.
 */
export async function logAudit(db: DbClient, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: entry.changes ?? null,
    });
  } catch (err) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "warn",
        msg: "audit_log_failed",
        action: entry.action,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}
