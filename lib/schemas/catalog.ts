import { z } from "zod";
import { zBigIntValue } from "@/lib/http/validation";
import { MSG } from "@/lib/http/messages";

const optionalCoercedInt = z.coerce.number().int().optional();
const optionalCoercedFloat = z.coerce.number().optional();
const optionalCoercedBool = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    return v === "true" || v === "1";
  });

const optionalBigIntQuery = z
  .string()
  .optional()
  .transform((v) => {
    if (!v?.trim()) return undefined;
    try {
      return BigInt(v.trim());
    } catch {
      return undefined;
    }
  });

export const productsQuerySchema = z.object({
  q: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "priceAsc", "priceDesc", "bestseller"])
    .optional(),
  categoryId: optionalCoercedInt,
  category: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "KIDS", "UNISEX"]).optional(),
  occasion: z.string().optional(),
  occasionId: optionalCoercedInt,
  tagId: optionalCoercedInt,
  isNew: optionalCoercedBool,
  isFeatured: optionalCoercedBool,
  isGift: optionalCoercedBool,
  minPrice: optionalBigIntQuery,
  maxPrice: optionalBigIntQuery,
  minWeight: optionalCoercedFloat,
  maxWeight: optionalCoercedFloat,
  wageTier: z.enum(["low", "mid", "high"]).optional(),
  inStock: optionalCoercedBool,
  page: optionalCoercedInt,
  pageSize: optionalCoercedInt,
});

export const goldPricePostSchema = z.object({
  price: zBigIntValue.refine((v) => v > 0n, { message: MSG.goldPrice.invalid }),
});
