import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { sendSms } from "@/lib/integrations/sms";
import { audit } from "@/lib/admin/audit";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody, zTrimmedString } from "@/lib/http/validation";
import { sendDeliverySmsSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(sendDeliverySmsSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const { orderId, trackingCode } = parsed.data;
    let phone = parsed.data.phone;
    let message = parsed.data.message;

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return ApiErr.notFound(MSG.order.notFound);
      phone = order.phone;
      if (trackingCode) {
        await prisma.order.update({
          where: { id: orderId },
          data: { trackingCode, status: "SHIPPED" },
        });
        message = message || `سفارش ${order.orderNumber} ارسال شد. کد رهگیری: ${trackingCode}`;
      }
    }

    const phoneCheck = zTrimmedString.safeParse(phone);
    const messageCheck = zTrimmedString.safeParse(message);
    if (!phoneCheck.success || !messageCheck.success) {
      return ApiErr.badRequest(MSG.common.missingFields);
    }

    await sendSms(phoneCheck.data, messageCheck.data, "SHIPPING", orderId ?? undefined);
    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "Order",
      entityId: orderId ?? null,
      summary: "ارسال پیامک رهگیری",
    });

    return apiSuccess({ message: MSG.delivery.smsSent });
  } catch (err) {
    console.error("SEND DELIVERY SMS ERROR", err);
    return ApiErr.internal();
  }
}
