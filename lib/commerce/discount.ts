import { prisma } from "@/lib/db";

export type DiscountError =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "USAGE_LIMIT"
  | "ALREADY_USED"
  | "MIN_ORDER"
  | "NOT_ELIGIBLE";

export interface DiscountResult {
  ok: true;
  codeId: number;
  amount: bigint; // مبلغ تخفیف محاسبه‌شده
}

/**
 * Validates a discount code for a given user + order subtotal and computes the
 * discount amount. Pure validation — does not mutate usage counters.
 */
export async function validateDiscount(
  code: string,
  userId: number,
  itemsTotal: bigint,
  user?: { isVip: boolean; isActive: boolean },
): Promise<DiscountResult | { ok: false; reason: DiscountError }> {
  const dc = await prisma.discountCode.findUnique({
    where: { code: code.trim() },
    include: { assignedUsers: { select: { id: true } } },
  });

  if (!dc) return { ok: false, reason: "NOT_FOUND" };
  if (!dc.isActive) return { ok: false, reason: "INACTIVE" };

  const now = new Date();
  if (dc.startsAt && now < dc.startsAt) return { ok: false, reason: "NOT_STARTED" };
  if (dc.expiresAt && now > dc.expiresAt) return { ok: false, reason: "EXPIRED" };

  if (dc.usageLimit != null && dc.usedCount >= dc.usageLimit) {
    return { ok: false, reason: "USAGE_LIMIT" };
  }

  // per-user limit
  const userUsages = await prisma.couponUsage.count({
    where: { codeId: dc.id, userId },
  });
  if (userUsages >= dc.perUserLimit) return { ok: false, reason: "ALREADY_USED" };

  if (itemsTotal < dc.minOrder) return { ok: false, reason: "MIN_ORDER" };

  // eligibility by target
  const u =
    user ??
    (await prisma.user.findUnique({
      where: { id: userId },
      select: { isVip: true, isActive: true },
    }));
  if (!u) return { ok: false, reason: "NOT_ELIGIBLE" };

  if (dc.target === "VIP" && !u.isVip) return { ok: false, reason: "NOT_ELIGIBLE" };
  if (dc.target === "INACTIVE" && u.isActive) return { ok: false, reason: "NOT_ELIGIBLE" };
  if (dc.target === "SPECIFIC" && !dc.assignedUsers.some((a) => a.id === userId)) {
    return { ok: false, reason: "NOT_ELIGIBLE" };
  }

  // compute amount
  let amount: bigint;
  if (dc.type === "PERCENT") {
    amount = (itemsTotal * BigInt(dc.value)) / 100n;
    if (dc.maxDiscount != null && amount > dc.maxDiscount) amount = dc.maxDiscount;
  } else {
    amount = BigInt(dc.value);
  }
  if (amount > itemsTotal) amount = itemsTotal;

  return { ok: true, codeId: dc.id, amount };
}
