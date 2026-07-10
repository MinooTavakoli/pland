import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      deliverySlot: true,
      items: true,
      tx: true,
    },
  });

  return NextResponse.json(serializeBigInt(orders));
}
