import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { getUserId, requireUser, serializeBigInt } from "@/lib/auth";
import { getPagination, paginated } from "@/lib/http/pagination";

export const runtime = "nodejs";

const GROUPS: Record<string, Prisma.OrderWhereInput["status"]> = {
  current: { in: ["PENDING", "PAID", "PROCESSING", "SHIPPED"] },
  completed: { in: ["DELIVERED", "COMPLETED"] },
  canceled: { in: ["CANCELED", "FAILED"] },
};

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.OrderWhereInput = { userId: getUserId(auth.payload) };
  const group = searchParams.get("group");
  if (group && GROUPS[group]) where.status = GROUPS[group];

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        items: true,
        tx: { select: { method: true, status: true } },
        deliverySlot: true,
        giftBag: { select: { id: true, title: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(orders, total, page)));
}
