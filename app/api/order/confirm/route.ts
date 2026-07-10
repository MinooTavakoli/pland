import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { finalizeOrderPayment, restoreOrderStock } from "@/lib/commerce/order";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { confirmPaymentSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Mock online payment callback – simulates a bank gateway success/failure. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(confirmPaymentSchema, await req.json(), MSG.order.idRequired);
    if (!parsed.ok) return parsed.response;

    const { orderId, success } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return ApiErr.notFound(MSG.order.notFound);
    if (order.userId !== getUserId(auth.payload)) return ApiErr.forbidden();
    if (order.status !== "PENDING" && order.status !== "FAILED") {
      return ApiErr.conflict(MSG.order.alreadyPaid);
    }

    if (!success) {
      await prisma.transaction.updateMany({
        where: { orderId: order.id },
        data: { status: "REJECTED" },
      });
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      await restoreOrderStock(order.id);
      return apiSuccess({ orderId: order.id, paid: false, message: MSG.order.mockPaymentFailed });
    }

    const result = await finalizeOrderPayment(order.id);
    await sendSms(
      order.phone,
      smsTemplates.paymentConfirmed(order.orderNumber, result?.trackingCode),
      "PAYMENT",
      order.id,
    );

    return apiSuccess({
      orderId: order.id,
      paid: true,
      trackingCode: result?.trackingCode,
      message: MSG.order.mockPaymentSuccess,
    });
  } catch (err) {
    console.error("ORDER CONFIRM ERROR", err);
    return ApiErr.internal();
  }
}
