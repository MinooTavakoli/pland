import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, getUserId } from "@/lib/auth";
import { addToCart } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { productIdOnlySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(productIdOnlySchema, await req.json(), MSG.product.idRequired);
    if (!parsed.ok) return parsed.response;

    const { productId } = parsed.data;
    const userId = getUserId(auth.payload);

    const result = await addToCart(userId, productId, 1);
    if (!result.ok) {
      if (result.reason === "PRODUCT_NOT_FOUND") return ApiErr.notFound(MSG.product.notFound);
      if (result.reason === "OUT_OF_STOCK") return ApiErr.conflict(MSG.cart.insufficientStock);
      return ApiErr.conflict(MSG.cart.productUnavailable);
    }

    await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return apiSuccess({ message: MSG.wishlist.movedToCart });
  } catch (err) {
    console.error("WISHLIST MOVE ERROR", err);
    return ApiErr.internal();
  }
}
