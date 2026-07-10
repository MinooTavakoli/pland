import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

const PAID_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const userId = Number(id);
  if (!userId) return ApiErr.badRequest(MSG.common.invalidId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      email: true,
      birthDate: true,
      isVip: true,
      isActive: true,
      createdAt: true,
      addresses: true,
    },
  });
  if (!user) return ApiErr.notFound(MSG.user.notFound);

  const [agg, orders] = await Promise.all([
    prisma.order.aggregate({
      where: { userId, status: { in: [...PAID_STATES] } },
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json(
    serializeBigInt({
      user,
      stats: {
        ordersCount: agg._count,
        totalSpent: agg._sum.total ?? 0n,
        averageOrder: agg._avg.total ? BigInt(Math.round(Number(agg._avg.total))) : 0n,
      },
      orders,
    }),
  );
}
