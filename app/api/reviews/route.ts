import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { createReviewSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const reviews = await prisma.review.findMany({
    where: { userId: getUserId(auth.payload) },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, title: true, slug: true } } },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const userId = getUserId(auth.payload);
    const parsed = parseBody(createReviewSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const { productId, orderId, rating, comment } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.userId !== userId) return ApiErr.notFound(MSG.order.notFound);

    if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
      return ApiErr.unprocessable(MSG.order.notDelivered);
    }
    if (!order.items.some((i) => i.productId === productId)) {
      return ApiErr.badRequest(MSG.product.notFound);
    }

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) return ApiErr.conflict(MSG.review.alreadyReviewed);

    await prisma.review.create({
      data: { userId, productId, orderId, rating, comment: comment ?? null, status: "PENDING" },
    });

    return apiSuccess({ message: MSG.review.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE REVIEW ERROR", err);
    return ApiErr.internal();
  }
}
