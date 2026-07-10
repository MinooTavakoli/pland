import {
  buildResponses,
  inferPreset,
  type ErrorStatus,
  type ResponsePreset,
} from "./responses";
import { openApiSchemas, schemaRef } from "./schemas";

export { schemaRef };

export const openApiComponents = {
  securitySchemes: {
    siteAuth: {
      type: "apiKey" as const,
      in: "cookie" as const,
      name: "site-auth",
      description: "کوکی ورود مشتری (پس از verify-otp)",
    },
    adminAuth: {
      type: "apiKey" as const,
      in: "cookie" as const,
      name: "admin-auth",
      description: "کوکی ورود ادمین",
    },
  },
  schemas: {
    ...openApiSchemas,
    Error: {
      type: "object",
      required: ["error"],
      properties: { error: { type: "string", example: "Unauthorized" } },
    },
    Success: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "Operation completed successfully" },
      },
      additionalProperties: true,
    },
  },
  responses: {} as Record<string, object>,
};

export const openApiTags = [
  { name: "Auth", description: "ورود و احراز هویت" },
  { name: "Products", description: "محصولات (عمومی)" },
  { name: "Catalog", description: "دسته‌بندی، تگ، مناسبت" },
  { name: "Cart", description: "سبد خرید (مشتری)" },
  { name: "Wishlist", description: "علاقه‌مندی‌ها" },
  { name: "Orders", description: "سفارش و پرداخت" },
  { name: "Account", description: "پروفایل، آدرس، داشبورد" },
  { name: "CMS", description: "بنر، FAQ، بلاگ، صفحات" },
  { name: "Campaigns", description: "کمپین‌ها" },
  { name: "Delivery", description: "بازه‌های ارسال" },
  { name: "GoldPrice", description: "قیمت طلا" },
  { name: "Admin", description: "پنل مدیریت" },
];

type Security = { siteAuth: string[] } | { adminAuth: string[] };

export interface OpOptions {
  tag: string;
  summary: string;
  description?: string;
  security?: Security[];
  /** Response preset; inferred from method + security if omitted */
  preset?: ResponsePreset;
  created?: boolean;
  errors?: ErrorStatus[];
  successDescription?: string;
  successExample?: object;
  successSchema?: object;
  requestBody?: object;
  parameters?: object[];
  responses?: Record<string, object>;
}

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

function securityKind(security?: Security[]): "site" | "admin" | null {
  if (!security?.length) return null;
  if (security.some((s) => "adminAuth" in s)) return "admin";
  if (security.some((s) => "siteAuth" in s)) return "site";
  return null;
}

/** Builds an OpenAPI operation with documented success + error responses. */
export function op(method: HttpMethod, opts: OpOptions) {
  const sec = securityKind(opts.security);
  const preset =
    opts.preset ??
    inferPreset(method, sec, undefined);

  const responses = buildResponses({
    preset,
    method,
    created: opts.created,
    errors: opts.errors,
    successDescription: opts.successDescription,
    successExample: opts.successExample,
    successSchema: opts.successSchema,
    extra: opts.responses,
  });

  const securityBlock =
    opts.security === undefined
      ? {}
      : opts.security.length === 0
        ? { security: [] as Security[] }
        : { security: opts.security };

  return {
    summary: opts.summary,
    description: opts.description,
    tags: [opts.tag],
    ...securityBlock,
    ...(opts.parameters ? { parameters: opts.parameters } : {}),
    ...(opts.requestBody ? { requestBody: opts.requestBody } : {}),
    responses,
  };
}

export const jsonBody = (schema: object, example?: object) => ({
  required: true,
  content: {
    "application/json": {
      schema,
      ...(example ? { example } : {}),
    },
  },
});

export const pathParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  description,
});

export const queryParam = (
  name: string,
  description: string,
  schema: object = { type: "string" },
) => ({
  name,
  in: "query",
  required: false,
  schema,
  description,
});

export const SITE: Security[] = [{ siteAuth: [] }];
export const ADMIN: Security[] = [{ adminAuth: [] }];
