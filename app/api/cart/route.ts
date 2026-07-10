import { NextRequest, NextResponse } from "next/server";
import { getUserId, requireUser, serializeBigInt } from "@/lib/auth";
import { summarizeCart } from "@/lib/commerce/cart";
import { getLatestGoldPrice } from "@/lib/catalog/gold";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const goldPrice = await getLatestGoldPrice();
    if (!goldPrice) return ApiErr.serviceUnavailable(MSG.goldPrice.notSet);

    const summary = await summarizeCart(getUserId(auth.payload), goldPrice);

    return NextResponse.json(
      serializeBigInt({
        items: summary.items,
        bag: summary.bag,
        discount: summary.discount,
        itemsTotal: summary.itemsTotal,
        cartTotal: summary.total,
      }),
    );
  } catch (error) {
    console.error("GET CART ERROR", error);
    return ApiErr.internal();
  }
}
