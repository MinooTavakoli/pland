import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getUserId, requireUser } from "@/lib/auth";
import { getOwnedCartProduct } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { productIdOnlySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(productIdOnlySchema, await req.json(), MSG.cart.productIdRequired);
    if (!parsed.ok) return parsed.response;

    const { productId } = parsed.data;
    const owned = await getOwnedCartProduct(getUserId(auth.payload), productId);
    if (!owned?.item) return ApiErr.notFound(MSG.cart.productNotInCart);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== "AVAILABLE") {
      return ApiErr.unprocessable(MSG.cart.productUnavailable);
    }
    if (product.stock < owned.item.quantity + 1) {
      return ApiErr.conflict(MSG.cart.insufficientStock);
    }

    await prisma.cartItem.update({
      where: { id: owned.item.id },
      data: { quantity: { increment: 1 } },
    });

    return apiSuccess({ message: MSG.cart.updated });
  } catch (err) {
    console.error("INCREASE CART ERROR", err);
    return ApiErr.internal();
  }
}
