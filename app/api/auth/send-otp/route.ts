import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { sendOtpSchema } from "@/lib/schemas";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";

export const runtime = "nodejs";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const parsed = parseBody(sendOtpSchema, await req.json(), MSG.auth.phoneRequired);
    if (!parsed.ok) return parsed.response;

    const { phone } = parsed.data;
    const otp = generateOtp();

    const otpToken = await new SignJWT({ phone, otp })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

    await sendSms(phone, smsTemplates.otp(otp), "OTP");

    const res = apiSuccess({ message: MSG.auth.otpSent });
    res.cookies.set("otp-token", otpToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });
    return res;
  } catch (err) {
    console.error("SEND OTP ERROR", err);
    return ApiErr.internal();
  }
}
