import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getUserId, requireUser } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.payload);
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return ApiErr.notFound(MSG.cart.notFound);
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { giftBagId: null, discountCodeId: null },
    });

    return apiSuccess({ message: MSG.cart.cleared });
  } catch (error) {
    console.error("CLEAR CART ERROR 👉", error);
    return ApiErr.internal();
  }
}
