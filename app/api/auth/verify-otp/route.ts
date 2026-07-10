import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { verifyOtpSchema } from "@/lib/schemas";
import { audit } from "@/lib/admin/audit";

export const runtime = "nodejs";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const parsed = parseBody(verifyOtpSchema, await req.json(), MSG.auth.otpInvalid);
    if (!parsed.ok) return parsed.response;

    const { otp } = parsed.data;
    const otpToken = req.cookies.get("otp-token")?.value;

    if (!otpToken) return ApiErr.badRequest(MSG.auth.otpExpired);

    let payload: { phone?: string; otp?: string };
    try {
      const result = await jwtVerify(otpToken, secret);
      payload = result.payload as { phone?: string; otp?: string };
    } catch {
      return ApiErr.badRequest(MSG.auth.otpInvalid);
    }

    if (!payload.otp || payload.otp !== otp) {
      return ApiErr.badRequest(MSG.auth.otpWrong);
    }

    const phone = payload.phone;
    if (!phone) return ApiErr.badRequest(MSG.auth.otpInvalid);

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, secret: "OTP_LOGIN", role: "USER" },
    });

    if (!user.isActive) return ApiErr.forbidden(MSG.auth.accountDisabled);

    const siteToken = await signToken({ userId: user.id, role: user.role });

    await audit({
      req,
      actorId: user.id,
      actorRole: user.role,
      action: "LOGIN",
      entity: "Auth",
      entityId: user.id,
      summary: "ورود کاربر با کد یکبارمصرف",
    });

    const res = apiSuccess({
      message: MSG.auth.loginSuccess,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    res.cookies.set("site-auth", siteToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set("otp-token", "", { maxAge: 0, path: "/" });

    return res;
  } catch (err) {
    console.error("VERIFY OTP ERROR", err);
    return ApiErr.internal();
  }
}
