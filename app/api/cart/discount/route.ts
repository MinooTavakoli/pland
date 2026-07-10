import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser, serializeBigInt } from "@/lib/auth";
import { ensureCart, summarizeCart } from "@/lib/commerce/cart";
import { validateDiscount, DiscountError } from "@/lib/commerce/discount";
import { getLatestGoldPrice, computeProductPrice } from "@/lib/catalog/gold";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { applyDiscountSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const ERR: Record<DiscountError, string> = {
  NOT_FOUND: MSG.discount.notFound,
  INACTIVE: MSG.discount.invalid,
  NOT_STARTED: MSG.discount.notStarted,
  EXPIRED: MSG.discount.expired,
  USAGE_LIMIT: MSG.discount.usageLimitReached,
  ALREADY_USED: MSG.discount.alreadyUsed,
  MIN_ORDER: MSG.discount.minOrderNotMet,
  NOT_ELIGIBLE: MSG.discount.notEligible,
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(applyDiscountSchema, await req.json(), MSG.discount.invalid);
    if (!parsed.ok) return parsed.response;

    const userId = getUserId(auth.payload);
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) return ApiErr.badRequest(MSG.cart.empty);

    const goldPrice = await getLatestGoldPrice();
    if (!goldPrice) return ApiErr.serviceUnavailable(MSG.goldPrice.notSet);

    let itemsTotal = 0n;
    for (const it of cart.items) {
      itemsTotal += computeProductPrice(it.product, goldPrice).total * BigInt(it.quantity);
    }

    const res = await validateDiscount(parsed.data.code, userId, itemsTotal);
    if (!res.ok) return ApiErr.unprocessable(ERR[res.reason]);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { discountCodeId: res.codeId },
    });

    const summary = await summarizeCart(userId, goldPrice);
    return NextResponse.json(
      serializeBigInt({
        message: MSG.discount.applied,
        discount: summary.discount,
        cartTotal: summary.total,
      }),
    );
  } catch (err) {
    console.error("CART DISCOUNT APPLY ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const cart = await ensureCart(getUserId(auth.payload));
    await prisma.cart.update({ where: { id: cart.id }, data: { discountCodeId: null } });
    return apiSuccess({ message: MSG.discount.removed });
  } catch (err) {
    console.error("CART DISCOUNT REMOVE ERROR", err);
    return ApiErr.internal();
  }
}
