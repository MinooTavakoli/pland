import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { parseQuery } from "@/lib/http/validation";
import { customersReportQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = parseQuery(customersReportQuerySchema, searchParams);
    if (!q.ok) return q.response;

    const type = q.data.type || "spent";
    const limit = Math.min(100, q.data.limit ?? 20);
    const format = q.data.format || "json";

    const where: Prisma.UserWhereInput = { role: "USER" };
    if (type === "vip") where.isVip = true;

    const orderBy: Prisma.UserOrderByWithRelationInput =
      type === "orders" ? { ordersCount: "desc" } : { totalSpent: "desc" };

    const users = await prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        isVip: true,
        totalSpent: true,
        ordersCount: true,
        lastOrderAt: true,
      },
    });

    if (format === "csv") {
      const csv = toCsv(
        ["نام", "موبایل", "VIP", "مجموع خرید", "تعداد سفارش"],
        users.map((u) => [
          [u.firstName, u.lastName].filter(Boolean).join(" "),
          u.phone,
          u.isVip ? "بله" : "خیر",
          u.totalSpent,
          u.ordersCount,
        ]),
      );
      return csvResponse(`customers-${type}.csv`, csv);
    }

    return NextResponse.json(serializeBigInt({ customers: users }));
  } catch (err) {
    console.error("CUSTOMERS REPORT ERROR", err);
    return ApiErr.internal();
  }
}
