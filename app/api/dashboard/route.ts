import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

const PAID_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const userId = getUserId(auth.payload);

    const [user, totalOrders, paidAgg, recentOrders, wishlistCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, isVip: true },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.order.aggregate({
        where: { userId, status: { in: [...PAID_STATES] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.wishlistItem.count({ where: { userId } }),
    ]);

    return NextResponse.json(
      serializeBigInt({
        profile: user,
        stats: {
          totalOrders,
          paidOrders: paidAgg._count,
          totalSpent: paidAgg._sum.total ?? 0n,
          wishlistCount,
        },
        recentOrders,
      }),
    );
  } catch (err) {
    console.error("USER DASHBOARD ERROR", err);
    return ApiErr.internal();
  }
}
