import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

const PAID_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

function startOf(period: "day" | "week" | "month" | "year"): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "day") return d;
  if (period === "week") {
    const day = d.getDay(); // 0..6
    d.setDate(d.getDate() - day);
    return d;
  }
  if (period === "month") {
    d.setDate(1);
    return d;
  }
  d.setMonth(0, 1);
  return d;
}

async function salesSince(date: Date): Promise<bigint> {
  const agg = await prisma.order.aggregate({
    where: { status: { in: [...PAID_STATES] }, createdAt: { gte: date } },
    _sum: { total: true },
  });
  return agg._sum.total ?? 0n;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const [today, week, month, year] = await Promise.all([
      salesSince(startOf("day")),
      salesSince(startOf("week")),
      salesSince(startOf("month")),
      salesSince(startOf("year")),
    ]);

    const [
      totalOrders,
      pendingOrders,
      pendingPayments,
      newUsersToday,
      newUsersWeek,
      totalUsers,
      lowStock,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: "PENDING", method: "MANUAL" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: startOf("day") } } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: startOf("week") } } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.product.count({ where: { status: "AVAILABLE", stock: { lte: 1 } } }),
    ]);

    return NextResponse.json(
      serializeBigInt({
        sales: { today, week, month, year },
        orders: { total: totalOrders, pending: pendingOrders, pendingPayments },
        users: { total: totalUsers, newToday: newUsersToday, newThisWeek: newUsersWeek },
        products: { lowStock },
      }),
    );
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR", err);
    return ApiErr.internal();
  }
}
