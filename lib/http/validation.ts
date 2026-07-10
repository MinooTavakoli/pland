import { z, type ZodType } from "zod";
import { NextResponse } from "next/server";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

// ─── Reusable field schemas ───────────────────────────────────────────────

export const zTrimmedString = z.string().trim().min(1);

export const zPhone = zTrimmedString.regex(/^09\d{9}$/, MSG.auth.phoneInvalid);

export const zEmail = z.string().trim().email(MSG.profile.emailInvalid);

/** Profile email: omit field, clear with "", or set valid email. */
export const zOptionalEmail = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((v, ctx) => {
    if (v === undefined) return;
    const trimmed = v === null ? "" : String(v).trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      ctx.addIssue({ code: "custom", message: MSG.profile.emailInvalid });
    }
  })
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null || String(v).trim() === "") return null;
    return String(v).trim();
  });

export const zId = z.coerce.number().int().positive();

export const zPositiveInt = z.coerce.number().int().positive();

export const zNonNegativeInt = z.coerce.number().int().min(0);

export const zRating = z.coerce.number().int().min(1).max(5);

export const zIdArray = z.array(z.coerce.number().int().positive());

export const zOptionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .nullable()
  .transform((v) => (v == null || Number.isNaN(v) ? null : v));

function coerceBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return undefined;
}

/** Boolean from JSON body (true/false, "true"/"false", 1/0). */
export const zOptionalBool = z.preprocess(coerceBool, z.boolean().optional());

/** Required boolean with coercion. */
export const zCoercedBool = z.preprocess(
  (v) => coerceBool(v) ?? v,
  z.boolean(),
);

export const zBigIntValue = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((v, ctx) => {
    try {
      if (typeof v === "bigint") return v;
      if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
      if (typeof v === "string" && v.trim() !== "") return BigInt(v.trim());
    } catch {
      ctx.addIssue({ code: "custom", message: MSG.common.invalidInput });
    }
    return z.NEVER;
  });

export const zBigIntOptional = z
  .union([z.string(), z.number(), z.bigint(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null || v === "") return null;
    try {
      if (typeof v === "bigint") return v;
      if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
      if (typeof v === "string" && v.trim() !== "") return BigInt(v.trim());
    } catch {
      return null;
    }
    return null;
  });

export const zDateOptional = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null || v === "") return null;
    const d = v instanceof Date ? v : new Date(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
  });

export const zImages = z.array(z.string()).optional().default([]);

// ─── Parse helpers ────────────────────────────────────────────────────────

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function formatZodError(error: z.ZodError, fallback: string): string {
  const issue = error.issues[0];
  if (issue?.message && !issue.message.startsWith("Invalid")) {
    return issue.message;
  }
  return fallback;
}

/** Validate JSON request body; returns ApiErr.badRequest on failure. */
export function parseBody<T extends ZodType>(
  schema: T,
  data: unknown,
  fallbackMessage: string = MSG.common.invalidInput,
): ParseResult<z.infer<T>> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      ok: false,
      response: ApiErr.badRequest(formatZodError(result.error, fallbackMessage)),
    };
  }
  return { ok: true, data: result.data };
}

/** Validate URL query string parameters. */
export function parseQuery<T extends ZodType>(
  schema: T,
  searchParams: URLSearchParams,
  fallbackMessage: string = MSG.common.invalidInput,
): ParseResult<z.infer<T>> {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return parseBody(schema, obj, fallbackMessage);
}

/** Validate multipart/form-data fields (string values only; files validated separately). */
export function parseFormFields<T extends ZodType>(
  schema: T,
  formData: FormData,
  fallbackMessage: string = MSG.common.invalidInput,
): ParseResult<z.infer<T>> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });
  return parseBody(schema, raw, fallbackMessage);
}

/** Picks only keys whose value is not undefined (for partial Prisma updates). */
export function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
