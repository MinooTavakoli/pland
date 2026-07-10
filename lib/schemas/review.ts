import { z } from "zod";
import { zId, zRating, zTrimmedString } from "@/lib/http/validation";

export const createReviewSchema = z.object({
  productId: zId,
  orderId: zId,
  rating: zRating,
  comment: zTrimmedString.optional().nullable(),
});
