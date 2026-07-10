import { z } from "zod";
import { zId } from "@/lib/http/validation";

export const idBodySchema = z.object({ id: zId });

export const productIdBodySchema = z.object({
  productId: zId,
});

export const optionalBagIdSchema = z.object({
  bagId: zId.optional().nullable(),
});
