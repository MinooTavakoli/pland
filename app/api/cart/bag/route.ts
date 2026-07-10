import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { ensureCart } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { setCartBagSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(setCartBagSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { bagId } = parsed.data;
    const bag = await prisma.giftBag.findUnique({ where: { id: bagId } });
    if (!bag || !bag.isActive || bag.stock <= 0) {
      return ApiErr.unprocessable(MSG.giftBag.unavailable);
    }

    const cart = await ensureCart(getUserId(auth.payload));
    await prisma.cart.update({ where: { id: cart.id }, data: { giftBagId: bagId } });

    return apiSuccess({ message: MSG.cart.bagSelected });
  } catch (err) {
    console.error("CART BAG SELECT ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const cart = await prisma.cart.findUnique({
      where: { userId: getUserId(auth.payload) },
    });
    if (cart) {
      await prisma.cart.update({ where: { id: cart.id }, data: { giftBagId: null } });
    }
    return apiSuccess({ message: MSG.cart.bagRemoved });
  } catch (err) {
    console.error("CART BAG REMOVE ERROR", err);
    return ApiErr.internal();
  }
}
