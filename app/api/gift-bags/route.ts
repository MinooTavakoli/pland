import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    // auto-hide bags that are inactive or out of stock
    const bags = await prisma.giftBag.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { price: "asc" },
      select: {
        id: true,
        type: true,
        title: true,
        image: true,
        price: true,
        description: true,
      },
    });
    return NextResponse.json(serializeBigInt({ bags }));
  } catch (err) {
    console.error("GIFT BAGS API ERROR", err);
    return ApiErr.internal();
  }
}
