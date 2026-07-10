import { NextRequest } from "next/server";
import { getUserId, requireUser } from "@/lib/auth";
import { addToCart } from "@/lib/commerce/cart";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { addToCartSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(addToCartSchema, await req.json(), MSG.cart.productIdRequired);
    if (!parsed.ok) return parsed.response;

    const { productId, quantity } = parsed.data;

    const result = await addToCart(getUserId(auth.payload), productId, quantity);
    if (!result.ok) {
      if (result.reason === "PRODUCT_NOT_FOUND") return ApiErr.notFound(MSG.product.notFound);
      if (result.reason === "OUT_OF_STOCK") return ApiErr.conflict(MSG.cart.insufficientStock);
      return ApiErr.unprocessable(MSG.cart.productUnavailable);
    }

    return apiSuccess({ message: MSG.cart.updated });
  } catch (error) {
    console.error("ADD TO CART ERROR", error);
    return ApiErr.internal();
  }
}
