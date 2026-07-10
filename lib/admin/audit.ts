import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "LOGIN"
  | "LOGOUT";

export interface AuditInput {
  req?: NextRequest;
  actorId?: number | null;
  actorRole?: "USER" | "ADMIN" | null;
  action: AuditAction;
  entity: string; // "Order" | "Product" | "User" | "Auth" ...
  entityId?: string | number | null;
  summary?: string;
  changes?: Record<string, unknown> | null;
}

function clientInfo(req?: NextRequest) {
  if (!req) return { ip: null as string | null, userAgent: null as string | null };
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ip, userAgent };
}

/**
 * Records an audit entry. Writes to the DB AuditLog table and to a file log.
 * Never throws — auditing must not break the main flow.
 */
export async function audit(input: AuditInput): Promise<void> {
  const { ip, userAgent } = clientInfo(input.req);
  const entityId =
    input.entityId === null || input.entityId === undefined
      ? null
      : String(input.entityId);

  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entity: input.entity,
        entityId,
        summary: input.summary ?? null,
        changes: (input.changes ?? undefined) as object | undefined,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("AUDIT DB ERROR", err);
  }

  await logger.info("audit", `${input.action} ${input.entity}`, {
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    entityId,
    summary: input.summary,
    ip,
  });
}

/**
 * Builds a shallow diff (before/after) limited to keys present in `after`.
 * Useful for UPDATE audit changes.
 */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    const a = before?.[key];
    const b = after[key];
    const av = typeof a === "bigint" ? a.toString() : a;
    const bv = typeof b === "bigint" ? b.toString() : b;
    if (JSON.stringify(av) !== JSON.stringify(bv)) {
      out[key] = { from: av, to: bv };
    }
  }
  return out;
}
