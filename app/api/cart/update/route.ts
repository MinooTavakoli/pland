import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getUserId, requireUser } from "@/lib/auth";
import { getOwnedCartItem } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { updateCartItemSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(
      updateCartItemSchema,
      await req.json(),
      MSG.cart.cartItemAndQuantityRequired,
    );
    if (!parsed.ok) return parsed.response;

    const { cartItemId, quantity } = parsed.data;

    const owned = await getOwnedCartItem(getUserId(auth.payload), cartItemId);
    if (!owned) return ApiErr.notFound(MSG.cart.itemNotFound);

    const product = await prisma.product.findUnique({
      where: { id: owned.item.productId },
    });
    if (!product || product.status !== "AVAILABLE") {
      return ApiErr.unprocessable(MSG.cart.productUnavailable);
    }
    if (product.stock < quantity) return ApiErr.conflict(MSG.cart.insufficientStock);

    await prisma.cartItem.update({
      where: { id: owned.item.id },
      data: { quantity },
    });

    return apiSuccess({ message: MSG.cart.updated });
  } catch (error) {
    console.error("UPDATE CART ITEM ERROR", error);
    return ApiErr.internal();
  }
}
