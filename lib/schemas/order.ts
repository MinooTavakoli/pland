import { z } from "zod";
import {
  zId,
  zPhone,
  zTrimmedString,
  zDateOptional,
  zCoercedBool,
} from "@/lib/http/validation";

const shippingMethodSchema = z.enum(["COURIER", "POST", "TIPAX"]).default("COURIER");
const paymentMethodSchema = z.enum(["ONLINE", "MANUAL"]).default("ONLINE");

export const checkoutSchema = z.object({
  fullName: zTrimmedString,
  phone: zPhone,
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  province: z.string().optional().nullable(),
  city: zTrimmedString,
  postal: zTrimmedString,
  address: zTrimmedString,
  birthDate: zDateOptional,
  note: z.string().optional().nullable(),
  deliverySlotId: z.coerce.number().int().positive().optional().nullable(),
  shippingMethod: shippingMethodSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
});

export const confirmPaymentSchema = z.object({
  orderId: zId,
  success: zCoercedBool.optional().default(true),
});

export const orderIdBodySchema = z.object({
  orderId: zId,
});

export const paymentConfirmActionSchema = z.object({
  orderId: zId,
  action: z.enum(["confirm", "reject"]),
});

export const orderStatusSchema = z.object({
  orderId: zId,
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELED",
    "FAILED",
  ]),
});

export const paymentUploadSchema = z.object({
  orderId: zId,
});

export const invoiceQuerySchema = z.object({
  orderId: z.coerce.number().int().positive(),
  format: z.enum(["json", "html"]).optional(),
});
