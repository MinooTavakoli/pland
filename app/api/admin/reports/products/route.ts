import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { parseQuery } from "@/lib/http/validation";
import { productsReportQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = parseQuery(productsReportQuerySchema, searchParams);
    if (!q.ok) return q.response;

    const order = q.data.order === "asc" ? "asc" : "desc";
    const limit = Math.min(100, q.data.limit ?? 20);
    const format = q.data.format || "json";

    const products = await prisma.product.findMany({
      orderBy: { soldCount: order },
      take: limit,
      select: {
        id: true,
        code: true,
        title: true,
        soldCount: true,
        stock: true,
        viewCount: true,
        priceCache: true,
      },
    });

    if (format === "csv") {
      const csv = toCsv(
        ["کد", "عنوان", "تعداد فروش", "موجودی", "بازدید"],
        products.map((p) => [p.code, p.title, p.soldCount, p.stock, p.viewCount]),
      );
      return csvResponse("products-report.csv", csv);
    }

    return NextResponse.json(serializeBigInt({ products }));
  } catch (err) {
    console.error("PRODUCTS REPORT ERROR", err);
    return ApiErr.internal();
  }
}
