import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return ApiErr.notFound(MSG.auth.userNotFound);
    }

    const validOtp = await bcrypt.compare(otp, user.secret);
    if (!validOtp) {
      return ApiErr.unauthorized(MSG.auth.invalidOtp);
    }

    const token = await signToken({ userId: user.id, role: user.role });

    const res = apiSuccess({ token, message: MSG.auth.loginSuccess });

    res.cookies.set("site-auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    return ApiErr.internal();
  }
}
