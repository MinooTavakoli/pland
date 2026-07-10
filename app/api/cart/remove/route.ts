import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { getOwnedCartItem } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { cartItemIdSchema } from "@/lib/schemas";

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.payload);
    const parsed = parseBody(cartItemIdSchema, await req.json(), MSG.cart.cartItemIdRequired);
    if (!parsed.ok) return parsed.response;

    const owned = await getOwnedCartItem(userId, parsed.data.cartItemId);
    if (!owned) {
      return ApiErr.notFound(MSG.cart.itemNotFound);
    }

    await prisma.cartItem.delete({ where: { id: owned.item.id } });

    return apiSuccess({ message: MSG.cart.updated });
  } catch (error) {
    console.error("REMOVE CART ITEM ERROR 👉", error);
    return ApiErr.internal();
  }
}
