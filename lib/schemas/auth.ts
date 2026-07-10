import { z } from "zod";
import { zPhone, zOptionalEmail, zDateOptional } from "@/lib/http/validation";

export const sendOtpSchema = z.object({
  phone: zPhone,
});

export const verifyOtpSchema = z.object({
  otp: z.string().trim().min(1),
});

export const adminLoginSchema = z.object({
  phone: z.string().trim().min(1),
  secret: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: zOptionalEmail,
    birthDate: zDateOptional,
  })
  .strict();
