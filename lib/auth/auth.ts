import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AuthPayload } from "./jwt";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

type AuthResult =
  | { ok: true; payload: AuthPayload }
  | { ok: false; response: NextResponse };

async function verifyCookie(token: string | undefined) {
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  req: NextRequest,
  role?: "USER" | "ADMIN",
): Promise<AuthResult> {
  if (role === "ADMIN") {
    const token = req.cookies.get("admin-auth")?.value;
    if (!token) return { ok: false, response: ApiErr.unauthorized() };

    const payload = await verifyCookie(token);
    if (!payload || payload.role !== "ADMIN") {
      return { ok: false, response: ApiErr.forbidden() };
    }
    return { ok: true, payload };
  }

  if (role === "USER") {
    const token = req.cookies.get("site-auth")?.value;
    if (!token) return { ok: false, response: ApiErr.unauthorized() };

    const payload = await verifyCookie(token);
    if (!payload || payload.role !== "USER") {
      return { ok: false, response: ApiErr.forbidden() };
    }
    return { ok: true, payload };
  }

  const siteToken = req.cookies.get("site-auth")?.value;
  const sitePayload = await verifyCookie(siteToken);
  if (sitePayload) return { ok: true, payload: sitePayload };

  const adminToken = req.cookies.get("admin-auth")?.value;
  const adminPayload = await verifyCookie(adminToken);
  if (adminPayload) return { ok: true, payload: adminPayload };

  return { ok: false, response: ApiErr.unauthorized() };
}

export async function requireUser(req: NextRequest): Promise<AuthResult> {
  return requireAuth(req, "USER");
}

export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  return requireAuth(req, "ADMIN");
}

export function getUserId(payload: AuthPayload): number {
  return Number(payload.userId);
}

export function getActor(payload: AuthPayload): {
  actorId: number;
  actorRole: "USER" | "ADMIN";
} {
  return { actorId: Number(payload.userId), actorRole: payload.role };
}

export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString() as T;
  if (obj instanceof Date) return obj.toISOString() as T;
  if (Array.isArray(obj)) return obj.map(serializeBigInt) as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeBigInt(value);
    }
    return result as T;
  }
  return obj;
}

export function authInvalidTokenResponse() {
  return ApiErr.unauthorized(MSG.auth.invalidToken);
}
