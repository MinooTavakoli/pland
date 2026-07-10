import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { finalizeOrderPayment, restoreOrderStock } from "@/lib/commerce/order";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";
import { audit } from "@/lib/admin/audit";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { paymentConfirmActionSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(paymentConfirmActionSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const { orderId, action } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return ApiErr.notFound(MSG.order.notFound);

    if (action === "confirm") {
      const result = await finalizeOrderPayment(orderId);
      await sendSms(
        order.phone,
        smsTemplates.paymentConfirmed(order.orderNumber, result?.trackingCode),
        "PAYMENT",
        order.id,
      );
      await audit({
        req,
        ...getActor(auth.payload),
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: orderId,
        summary: `تأیید پرداخت دستی سفارش ${order.orderNumber}`,
      });
      return apiSuccess({
        message: MSG.order.paymentConfirmed,
        trackingCode: result?.trackingCode,
      });
    }

    if (action === "reject") {
      await prisma.transaction.updateMany({
        where: { orderId },
        data: { status: "REJECTED" },
      });
      await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
      await restoreOrderStock(orderId);
      await audit({
        req,
        ...getActor(auth.payload),
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: orderId,
        summary: `رد پرداخت سفارش ${order.orderNumber}`,
      });
      return apiSuccess({ message: MSG.order.paymentRejected });
    }

    return ApiErr.badRequest(MSG.order.invalidAction);
  } catch (err) {
    console.error("ADMIN PAYMENT CONFIRM ERROR", err);
    return ApiErr.internal();
  }
}
