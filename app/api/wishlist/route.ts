import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, getUserId } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { getLatestGoldPrice } from "@/lib/catalog/gold";
import { serializeProductCard } from "@/lib/catalog/product";
import { parseBody } from "@/lib/http/validation";
import { productIdOnlySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const goldPrice = await getLatestGoldPrice();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: getUserId(auth.payload) },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          categories: { select: { id: true, title: true, slug: true, parentId: true } },
        },
      },
    },
  });

  const products = goldPrice
    ? items.map((i) => serializeProductCard(i.product, goldPrice))
    : items.map((i) => ({ id: i.product.id, title: i.product.title, slug: i.product.slug }));

  return NextResponse.json({ items: products });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(productIdOnlySchema, await req.json(), MSG.product.idRequired);
    if (!parsed.ok) return parsed.response;

    const { productId } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return ApiErr.notFound(MSG.product.notFound);

    const userId = getUserId(auth.payload);
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) return ApiErr.conflict(MSG.wishlist.exists);

    await prisma.wishlistItem.create({ data: { userId, productId } });
    return apiSuccess({ message: MSG.wishlist.added }, HTTP.CREATED);
  } catch (err) {
    console.error("WISHLIST ADD ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(productIdOnlySchema, await req.json(), MSG.product.idRequired);
    if (!parsed.ok) return parsed.response;

    const { productId } = parsed.data;
    const userId = getUserId(auth.payload);
    await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return apiSuccess({ message: MSG.wishlist.removed });
  } catch (err) {
    console.error("WISHLIST REMOVE ERROR", err);
    return ApiErr.internal();
  }
}
