import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { getPagination, paginated } from "@/lib/http/pagination";
import { parseQuery } from "@/lib/http/validation";
import { auditLogsQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.AuditLogWhereInput = {};
  const entity = searchParams.get("entity");
  if (entity) where.entity = entity;
  const action = searchParams.get("action");
  if (action) where.action = action as Prisma.AuditLogWhereInput["action"];

  const q = parseQuery(auditLogsQuerySchema, searchParams);
  if (q.ok && q.data.actorId) where.actorId = q.data.actorId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(logs, total, page)));
}
