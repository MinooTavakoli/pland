import { z } from "zod";
import { zId, zTrimmedString, zOptionalBool } from "@/lib/http/validation";

export const createAddressSchema = z.object({
  title: z.string().optional().nullable(),
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: zTrimmedString,
  postal: zTrimmedString,
  address: zTrimmedString,
  isDefault: zOptionalBool,
});

export const updateAddressSchema = z.object({
  id: zId,
  title: z.string().optional().nullable(),
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: zTrimmedString.optional(),
  postal: zTrimmedString.optional(),
  address: zTrimmedString.optional(),
  isDefault: zOptionalBool,
});

export const deleteAddressSchema = z.object({ id: zId });
