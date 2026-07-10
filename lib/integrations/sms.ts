import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export type SmsType =
  | "OTP"
  | "ORDER"
  | "PAYMENT"
  | "SHIPPING"
  | "DELIVERY"
  | "DISCOUNT"
  | "PROMO";

/**
 * Mock SMS sender. In production this would call an SMS provider; here it
 * logs to console + file and persists an SmsMessage record for the panel.
 */
export async function sendSms(
  phone: string,
  message: string,
  type: SmsType,
  relatedId?: number,
): Promise<{ ok: boolean }> {
  let record: { id: number } | null = null;
  try {
    record = await prisma.smsMessage.create({
      data: { phone, message, type, relatedId: relatedId ?? null, status: "PENDING" },
      select: { id: true },
    });
  } catch (err) {
    console.error("SMS RECORD ERROR", err);
  }

  // Mock delivery
  console.log("📩 SMS MOCK", { to: phone, type, message });

  try {
    if (record) {
      await prisma.smsMessage.update({
        where: { id: record.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    }
    await logger.info("sms", `sent ${type}`, { phone, relatedId });
    return { ok: true };
  } catch (err) {
    console.error("SMS SEND ERROR", err);
    if (record) {
      await prisma.smsMessage
        .update({
          where: { id: record.id },
          data: { status: "FAILED", error: String(err) },
        })
        .catch(() => undefined);
    }
    return { ok: false };
  }
}

/** Backwards-compatible mock used by older OTP code paths. */
export function sendSmsMock(phone: string, message: string) {
  console.log("📩 SMS MOCK");
  console.log("to:", phone);
  console.log("message:", message);
}

export const smsTemplates = {
  otp: (code: string) => `کد ورود شما به گالری پادیمو: ${code}`,
  orderPlaced: (orderNumber: string) =>
    `سفارش شما با شماره ${orderNumber} ثبت شد. از خرید شما سپاسگزاریم.`,
  paymentConfirmed: (orderNumber: string, trackingCode?: string) =>
    `پرداخت سفارش ${orderNumber} تأیید شد.${trackingCode ? ` کد پیگیری: ${trackingCode}` : ""}`,
  shipped: (orderNumber: string, tracking: string) =>
    `سفارش ${orderNumber} ارسال شد. کد پیگیری: ${tracking}`,
  delivered: (orderNumber: string) =>
    `سفارش ${orderNumber} تحویل داده شد. لطفاً نظر خود را ثبت کنید.`,
  discount: (code: string) =>
    `کد تخفیف اختصاصی شما در گالری پادیمو: ${code}`,
};
