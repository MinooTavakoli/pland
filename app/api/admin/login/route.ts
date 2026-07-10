import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { audit } from "@/lib/admin/audit";
import { parseBody } from "@/lib/http/validation";
import { adminLoginSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const parsed = parseBody(adminLoginSchema, await req.json(), MSG.common.invalidInput);
    if (!parsed.ok) return parsed.response;

    const { phone, secret } = parsed.data;

    const admin = await prisma.user.findFirst({
      where: { phone, role: "ADMIN" },
    });

    if (!admin || admin.secret !== secret) {
      return ApiErr.unauthorized(MSG.auth.adminLoginFailed);
    }

    if (!admin.isActive) return ApiErr.forbidden(MSG.auth.accountDisabled);

    const token = await signToken({ userId: admin.id, role: "ADMIN" });

    await audit({
      req,
      actorId: admin.id,
      actorRole: "ADMIN",
      action: "LOGIN",
      entity: "Auth",
      entityId: admin.id,
      summary: "ورود ادمین",
    });

    const res = apiSuccess({ message: MSG.auth.loginSuccess });
    res.cookies.set({
      name: "admin-auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error("ADMIN LOGIN ERROR", err);
    return ApiErr.internal();
  }
}
