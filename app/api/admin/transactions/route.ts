import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { getPagination, paginated } from "@/lib/http/pagination";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.TransactionWhereInput = {};
  const status = searchParams.get("status");
  if (status && ["PENDING", "PAID", "REJECTED", "REFUNDED"].includes(status)) {
    where.status = status as Prisma.TransactionWhereInput["status"];
  }
  const method = searchParams.get("method");
  if (method && ["ONLINE", "MANUAL"].includes(method)) {
    where.method = method as Prisma.TransactionWhereInput["method"];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        order: {
          select: { id: true, orderNumber: true, fullName: true, phone: true, status: true },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(transactions, total, page)));
}
