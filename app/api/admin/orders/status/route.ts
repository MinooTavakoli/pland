import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { restoreOrderStock, refreshUserStats, generateTrackingCode } from "@/lib/commerce/order";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";
import { audit } from "@/lib/admin/audit";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { orderStatusSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(orderStatusSchema, await req.json(), MSG.order.statusAndIdRequired);
    if (!parsed.ok) return parsed.response;

    const { orderId, status } = parsed.data;

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return ApiErr.notFound(MSG.order.notFound);

    if (
      (status === "CANCELED" || status === "FAILED") &&
      existing.status !== "CANCELED" &&
      existing.status !== "FAILED"
    ) {
      await restoreOrderStock(orderId);
    }

    let trackingCode = existing.trackingCode;
    if (status === "SHIPPED" && !trackingCode) {
      trackingCode = generateTrackingCode();
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status, trackingCode },
    });

    if (status === "SHIPPED") {
      await sendSms(order.phone, smsTemplates.shipped(order.orderNumber, trackingCode || ""), "SHIPPING", order.id);
    } else if (status === "DELIVERED") {
      await sendSms(order.phone, smsTemplates.delivered(order.orderNumber), "DELIVERY", order.id);
    }

    if (["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "FAILED"].includes(status)) {
      await refreshUserStats(order.userId);
    }

    await audit({
      req,
      ...getActor(auth.payload),
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: orderId,
      summary: `تغییر وضعیت سفارش ${order.orderNumber} به ${status}`,
      changes: { status: { from: existing.status, to: status } },
    });

    return apiSuccess({ order: { id: order.id, status: order.status, trackingCode: order.trackingCode }, message: MSG.order.statusUpdated });
  } catch (err) {
    console.error("ADMIN ORDER STATUS ERROR", err);
    return ApiErr.internal();
  }
}
