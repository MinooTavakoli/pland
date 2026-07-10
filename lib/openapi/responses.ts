/** HTTP error examples aligned with lib/http/messages.ts and lib/http/api-response.ts */

export const ERR = {
  "400": "اطلاعات ناقص است",
  "401": "دسترسی غیرمجاز",
  "403": "شما اجازه دسترسی به این بخش را ندارید",
  "404": "مورد درخواستی یافت نشد",
  "409": "این مورد از قبل ثبت شده است",
  "422": "اطلاعات ارسالی نامعتبر است",
  "500": "خطای داخلی سرور",
  "503": "قیمت طلا ثبت نشده است",
} as const;

export type ErrorStatus = keyof typeof ERR;

const errorSchemaRef = { $ref: "#/components/schemas/Error" };
const successSchemaRef = { $ref: "#/components/schemas/Success" };

function jsonResponse(
  description: string,
  schema: object,
  example?: object,
): object {
  return {
    description,
    content: {
      "application/json": {
        schema,
        ...(example !== undefined ? { example } : {}),
      },
    },
  };
}

function errorResponse(status: ErrorStatus, description?: string): object {
  return jsonResponse(description || defaultErrorDesc(status), errorSchemaRef, {
    error: ERR[status],
  });
}

function defaultErrorDesc(status: ErrorStatus): string {
  const map: Record<ErrorStatus, string> = {
    "400": "درخواست نامعتبر",
    "401": "احراز هویت نشده",
    "403": "دسترسی ممنوع",
    "404": "یافت نشد",
    "409": "تعارض (مثلاً تکراری یا موجودی)",
    "422": "قابل پردازش نیست (اعتبارسنجی)",
    "500": "خطای سرور",
    "503": "سرویس در دسترس نیست",
  };
  return map[status];
}

function successResponse(
  status: "200" | "201",
  description: string,
  example?: object,
  schema?: object,
): object {
  return jsonResponse(description, schema || successSchemaRef, example);
}

export type ResponsePreset =
  | "publicRead"
  | "publicReadOne"
  | "publicAuth"
  | "siteRead"
  | "siteWrite"
  | "siteCreate"
  | "siteDelete"
  | "adminRead"
  | "adminWrite"
  | "adminCreate"
  | "adminDelete"
  | "checkout"
  | "csv";

export interface BuildResponsesOpts {
  preset?: ResponsePreset;
  method: "get" | "post" | "put" | "patch" | "delete";
  created?: boolean;
  /** Extra error status codes for this operation */
  errors?: ErrorStatus[];
  successDescription?: string;
  successExample?: object;
  successSchema?: object;
  extra?: Record<string, object>;
}

const PRESET_ERRORS: Record<ResponsePreset, ErrorStatus[]> = {
  publicRead: ["500"],
  publicReadOne: ["404", "503", "500"],
  publicAuth: ["400", "401", "403", "404", "500"],
  siteRead: ["401", "403", "500"],
  siteWrite: ["400", "401", "403", "404", "409", "422", "500"],
  siteCreate: ["400", "401", "403", "404", "409", "422", "500"],
  siteDelete: ["400", "401", "403", "404", "500"],
  adminRead: ["401", "403", "500"],
  adminWrite: ["400", "401", "403", "404", "409", "500"],
  adminCreate: ["400", "401", "403", "409", "500"],
  adminDelete: ["400", "401", "403", "404", "409", "500"],
  checkout: ["400", "401", "403", "404", "409", "422", "503", "500"],
  csv: ["401", "403", "500"],
};

const PRESET_SUCCESS_DESC: Record<ResponsePreset, string> = {
  publicRead: "لیست با موفقیت",
  publicReadOne: "جزئیات",
  publicAuth: "عملیات موفق",
  siteRead: "موفق",
  siteWrite: "عملیات با موفقیت انجام شد",
  siteCreate: "ایجاد شد",
  siteDelete: "حذف شد",
  adminRead: "لیست (ادمین)",
  adminWrite: "به‌روزرسانی شد",
  adminCreate: "ایجاد شد",
  adminDelete: "حذف شد",
  checkout: "سفارش ثبت شد",
  csv: "فایل CSV",
};

/** Default success examples per preset (override per-route via successExample). */
export const PRESET_SUCCESS_EXAMPLES: Partial<Record<ResponsePreset, object>> =
  {
    publicAuth: { success: true, message: "کد تأیید ارسال شد" },
    siteRead: {
      user: {
        id: 1,
        phone: "09121234567",
        firstName: "علی",
        lastName: "رضایی",
        role: "USER",
      },
    },
    siteWrite: { success: true, message: "سبد خرید به‌روزرسانی شد" },
    siteCreate: {
      success: true,
      message: "سفارش با موفقیت ثبت شد",
      order: { id: 1, orderNumber: "PD-20260604-1234", status: "PENDING" },
    },
    checkout: {
      order: {
        id: 1,
        orderNumber: "PD-20260604-1234",
        status: "PENDING",
        total: "561589600",
        paymentMethod: "ONLINE",
      },
      message: "Order created",
    },
    adminRead: {
      items: [
        {
          id: 1,
          title: "Example record",
          createdAt: "2026-06-04T12:00:00.000Z",
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
    adminCreate: { success: true, message: "با موفقیت ایجاد شد" },
    publicRead: {
      items: [
        {
          id: 1,
          title: "انگشتر طلا",
          slug: "example",
          excerpt: "Short description",
          publishedAt: "2026-06-04T12:00:00.000Z",
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
  };

export function inferPreset(
  method: BuildResponsesOpts["method"],
  security?: "site" | "admin" | null,
  override?: ResponsePreset,
): ResponsePreset {
  if (override) return override;
  if (!security) {
    if (method === "get") return "publicRead";
    return "publicAuth";
  }
  if (security === "site") {
    if (method === "get") return "siteRead";
    if (method === "delete") return "siteDelete";
    return "siteWrite";
  }
  if (method === "get") return "adminRead";
  if (method === "delete") return "adminDelete";
  if (method === "post") return "adminCreate";
  return "adminWrite";
}

export function buildResponses(
  opts: BuildResponsesOpts,
): Record<string, object> {
  const preset = opts.preset ?? inferPreset(opts.method, null);
  const errorCodes = new Set<ErrorStatus>([
    ...PRESET_ERRORS[preset],
    ...(opts.errors ?? []),
  ]);

  const successStatus =
    opts.created ||
    preset === "siteCreate" ||
    preset === "adminCreate" ||
    preset === "checkout"
      ? "201"
      : "200";
  const successDesc = opts.successDescription ?? PRESET_SUCCESS_DESC[preset];
  const successEx =
    opts.successExample ??
    PRESET_SUCCESS_EXAMPLES[preset] ??
    (successStatus === "201"
      ? { success: true, message: "با موفقیت ایجاد شد" }
      : { success: true, message: "عملیات با موفقیت انجام شد" });

  const out: Record<string, object> = {
    [successStatus]: successResponse(
      successStatus,
      successDesc,
      successEx,
      opts.successSchema,
    ),
    ...opts.extra,
  };

  for (const code of errorCodes) {
    out[code] = errorResponse(code);
  }

  if (preset === "csv") {
    out["200"] = {
      description: "فایل CSV",
      content: { "text/csv": { schema: { type: "string" } } },
    };
  }

  return out;
}

/** Component-level $ref responses (used by buildResponses inline examples). */
export const componentResponses = {
  BadRequest: errorResponse("400"),
  Unauthorized: errorResponse("401"),
  Forbidden: errorResponse("403"),
  NotFound: errorResponse("404"),
  Conflict: errorResponse("409"),
  Unprocessable: errorResponse("422"),
  Internal: errorResponse("500"),
  ServiceUnavailable: errorResponse("503"),
  Success200: successResponse("200", "موفق"),
  Success201: successResponse("201", "ایجاد شد"),
};
