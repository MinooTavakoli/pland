import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { getOwnedCartProduct } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { productIdOnlySchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.payload);
    const parsed = parseBody(productIdOnlySchema, await req.json(), MSG.cart.productIdRequired);
    if (!parsed.ok) return parsed.response;

    const owned = await getOwnedCartProduct(userId, parsed.data.productId);
    if (!owned?.item) {
      return ApiErr.notFound(MSG.cart.productNotInCart);
    }

    if (owned.item.quantity > 1) {
      await prisma.cartItem.update({
        where: { id: owned.item.id },
        data: { quantity: owned.item.quantity - 1 },
      });
    } else {
      await prisma.cartItem.delete({ where: { id: owned.item.id } });
    }

    return apiSuccess({ message: MSG.cart.updated });
  } catch (error) {
    console.error("DECREASE CART ITEM ERROR 👉", error);
    return ApiErr.internal();
  }
}
