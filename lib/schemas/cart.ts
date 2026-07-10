import { z } from "zod";
import { zId, zPositiveInt, zTrimmedString } from "@/lib/http/validation";

export const addToCartSchema = z.object({
  productId: zId,
  quantity: zPositiveInt.optional().default(1),
});

export const updateCartItemSchema = z.object({
  cartItemId: zId,
  quantity: zPositiveInt,
});

export const productIdOnlySchema = z.object({
  productId: zId,
});

export const cartItemIdSchema = z.object({
  cartItemId: zId,
});

export const setCartBagSchema = z.object({
  bagId: zId,
});

export const applyDiscountSchema = z.object({
  code: zTrimmedString,
});
