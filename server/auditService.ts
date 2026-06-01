import { getDb } from "./db";
import { auditLog } from "../drizzle/schema";

type Action = "create" | "update" | "delete";

interface AuditOpts {
  action: Action;
  studentId?: number | null;
  studentName?: string | null;
  studentSid?: string | null;
  performedBy?: number | null;
  performedName?: string | null;
  changes?: Record<string, [unknown, unknown]>;
  snapshot?: unknown;
  ip?: string | null;
}

export async function writeAuditLog(opts: AuditOpts): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLog).values({
      action: opts.action,
      studentId: opts.studentId ?? null,
      studentName: opts.studentName ?? null,
      studentSid: opts.studentSid ?? null,
      performedBy: opts.performedBy ?? null,
      performedName: opts.performedName ?? null,
      changes: opts.changes ?? null,
      snapshot: opts.snapshot ?? null,
      ip: opts.ip ?? null,
    });
  } catch (err) {
    console.error("[Audit] write failed:", err);
  }
}

const SKIP = new Set(["updatedAt", "createdAt", "id"]);

export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, [unknown, unknown]> {
  const changes: Record<string, [unknown, unknown]> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  keys.forEach(k => {
    if (SKIP.has(k)) return;
    const b = before[k], a = after[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes[k] = [b ?? null, a ?? null];
    }
  });
  return changes;
}
