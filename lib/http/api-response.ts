import { NextResponse } from "next/server";
import { HTTP, MSG } from "@/lib/http/messages";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(
  data?: T,
  status: number = HTTP.OK,
) {
  return NextResponse.json({ success: true, message: MSG.common.success, ...data }, { status });
}

export const ApiErr = {
  badRequest: (message: string) => apiError(message, HTTP.BAD_REQUEST),
  unauthorized: (message: string = MSG.common.unauthorized) =>
    apiError(message, HTTP.UNAUTHORIZED),
  forbidden: (message: string = MSG.common.forbidden) =>
    apiError(message, HTTP.FORBIDDEN),
  notFound: (message: string = MSG.common.notFound) =>
    apiError(message, HTTP.NOT_FOUND),
  conflict: (message: string) => apiError(message, HTTP.CONFLICT),
  unprocessable: (message: string) => apiError(message, HTTP.UNPROCESSABLE),
  internal: (message: string = MSG.common.internalError) =>
    apiError(message, HTTP.INTERNAL),
  serviceUnavailable: (message: string) =>
    apiError(message, HTTP.SERVICE_UNAVAILABLE),
};
