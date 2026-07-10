import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireAuth, serializeBigInt } from "@/lib/auth";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { orderId } = await params;
  const id = Number(orderId);

  if (!id) {
    return ApiErr.badRequest(MSG.order.idRequired);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      tx: true,
      deliverySlot: true,
      giftBag: { select: { id: true, title: true } },
      discountCode: { select: { code: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!order) {
    return ApiErr.notFound(MSG.order.notFound);
  }

  const userId = getUserId(auth.payload);
  const isOwner = order.userId === userId;
  const isAdmin = auth.payload.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return ApiErr.forbidden();
  }

  return NextResponse.json(serializeBigInt(order));
}
