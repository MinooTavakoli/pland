import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { parseQuery } from "@/lib/http/validation";
import { salesReportQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

const PAID_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

function periodKey(d: Date, groupBy: string): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (groupBy === "year") return `${y}`;
  if (groupBy === "month") return `${y}-${m}`;
  if (groupBy === "week") {
    const onejan = new Date(y, 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = parseQuery(salesReportQuerySchema, searchParams);
    if (!q.ok) return q.response;

    const groupBy = q.data.groupBy || "day";
    const format = q.data.format || "json";
    const to = q.data.to ?? new Date();
    const from = q.data.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { status: { in: [...PAID_STATES] }, createdAt: { gte: from, lte: to } },
      select: { total: true, createdAt: true },
    });

    const map = new Map<string, { revenue: bigint; count: number }>();
    for (const o of orders) {
      const key = periodKey(o.createdAt, groupBy);
      const cur = map.get(key) ?? { revenue: 0n, count: 0 };
      cur.revenue += o.total;
      cur.count += 1;
      map.set(key, cur);
    }

    const series = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([period, v]) => ({
        period,
        revenue: v.revenue.toString(),
        orders: v.count,
      }));

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0n);

    if (format === "csv") {
      const csv = toCsv(
        ["دوره", "تعداد سفارش", "درآمد"],
        series.map((s) => [s.period, s.orders, s.revenue]),
      );
      return csvResponse(`sales-${groupBy}.csv`, csv);
    }

    return NextResponse.json({
      groupBy,
      from: from.toISOString(),
      to: to.toISOString(),
      totalRevenue: totalRevenue.toString(),
      totalOrders: orders.length,
      series,
    });
  } catch (err) {
    console.error("SALES REPORT ERROR", err);
    return ApiErr.internal();
  }
}
