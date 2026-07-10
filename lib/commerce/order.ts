import { prisma } from "@/lib/db";
import { getSettingBigInt, SETTING_KEYS } from "@/lib/admin/settings";

export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PD-${ymd}-${rand}`;
}

export function generateInvoiceNumber(orderNumber: string): string {
  return `INV-${orderNumber}`;
}

export function generateTrackingCode(): string {
  return `TRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
}

/**
 * Recomputes a user's aggregate purchase stats from PAID/COMPLETED orders and
 * updates VIP status based on the configured threshold.
 */
export async function refreshUserStats(userId: number): Promise<void> {
  const agg = await prisma.order.aggregate({
    where: { userId, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] } },
    _sum: { total: true },
    _count: true,
  });
  const totalSpent = agg._sum.total ?? 0n;
  const ordersCount = agg._count;

  const threshold = await getSettingBigInt(SETTING_KEYS.VIP_THRESHOLD);
  const last = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalSpent,
      ordersCount,
      isVip: threshold > 0n ? totalSpent >= threshold : false,
      lastOrderAt: last?.createdAt ?? null,
    },
  });
}

/**
 * Finalizes payment for an order: marks it PAID, generates an invoice,
 * increments product sold counts and refreshes the buyer's stats. Idempotent.
 * Returns the updated order id, or null when the order does not exist.
 */
export async function finalizeOrderPayment(
  orderId: number,
): Promise<{ id: number; trackingCode: string } | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: true },
  });
  if (!order) return null;
  if (order.status !== "PENDING" && order.status !== "FAILED") {
    // already processed beyond payment; treat as idempotent success
    return { id: order.id, trackingCode: order.trackingCode ?? "" };
  }

  const trackingCode = order.trackingCode ?? generateTrackingCode();

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", trackingCode },
    });
    await tx.transaction.updateMany({
      where: { orderId: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    // increment sold counts
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }
    }

    // create invoice if missing
    if (!order.invoice) {
      await tx.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: generateInvoiceNumber(order.orderNumber),
          total: order.total,
          items: {
            create: order.items.map((it) => ({
              title: it.title,
              weight: it.weight,
              goldPrice: it.goldBase * BigInt(it.quantity),
              wage: it.wageAmount * BigInt(it.quantity),
              profit: it.profitAmount * BigInt(it.quantity),
              tax: it.taxAmount * BigInt(it.quantity),
              total: it.price * BigInt(it.quantity),
            })),
          },
        },
      });
    }
  });

  await refreshUserStats(order.userId);
  return { id: order.id, trackingCode };
}

/**
 * Restores reserved stock for an order's items (used on cancel/failure).
 */
export async function restoreOrderStock(orderId: number): Promise<void> {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (it.productId) {
      await prisma.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
  }
}
