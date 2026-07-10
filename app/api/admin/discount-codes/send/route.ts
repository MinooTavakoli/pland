import { NextRequest } from "next/server";
import { Prisma } from "../../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";
import { audit } from "@/lib/admin/audit";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { discountSendSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(discountSendSchema, await req.json(), MSG.discount.notFound);
    if (!parsed.ok) return parsed.response;

    const { codeId, target, userIds, message: customMessage } = parsed.data;

    const discount = await prisma.discountCode.findUnique({ where: { id: codeId } });
    if (!discount) return ApiErr.notFound(MSG.discount.notFound);

    const where: Prisma.UserWhereInput = { role: "USER", isActive: true };
    if (target === "VIP") {
      where.isVip = true;
    } else if (target === "INACTIVE") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      where.OR = [{ lastOrderAt: null }, { lastOrderAt: { lt: cutoff } }];
    } else if (target === "SPECIFIC") {
      const ids = userIds ?? [];
      if (!ids.length) return ApiErr.badRequest(MSG.common.missingFields);
      where.id = { in: ids };
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true, phone: true },
    });

    if (recipients.length === 0) {
      return apiSuccess({ message: MSG.discount.sent, count: 0 });
    }

    await prisma.discountCode.update({
      where: { id: codeId },
      data: { assignedUsers: { connect: recipients.map((r) => ({ id: r.id })) } },
    });

    const message = customMessage?.trim()
      ? customMessage
      : smsTemplates.discount(discount.code);

    let sent = 0;
    for (const r of recipients) {
      const res = await sendSms(r.phone, message, "DISCOUNT", codeId);
      if (res.ok) sent += 1;
    }

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "DiscountCode",
      entityId: codeId,
      summary: `ارسال کد تخفیف ${discount.code} به ${sent} کاربر (${target})`,
    });

    return apiSuccess({ message: MSG.discount.sent, count: sent });
  } catch (err) {
    console.error("SEND DISCOUNT ERROR", err);
    return ApiErr.internal();
  }
}
