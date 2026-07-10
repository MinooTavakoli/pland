import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireAuth, serializeBigInt } from "@/lib/auth";
import { getSetting, SETTING_KEYS } from "@/lib/admin/settings";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseQuery } from "@/lib/http/validation";
import { invoiceQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

function fmt(n: bigint | number): string {
  return Number(n).toLocaleString("fa-IR");
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = parseQuery(invoiceQuerySchema, searchParams, MSG.order.idRequired);
  if (!q.ok) return q.response;

  const { orderId, format = "json" } = q.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: { include: { items: true } }, giftBag: true },
  });
  if (!order) return ApiErr.notFound(MSG.order.notFound);

  const isOwner = order.userId === getUserId(auth.payload);
  const isAdmin = auth.payload.role === "ADMIN";
  if (!isOwner && !isAdmin) return ApiErr.forbidden();

  if (!order.invoice) return ApiErr.notFound(MSG.invoice.notFound);

  if (format === "html") {
    const storeName = (await getSetting(SETTING_KEYS.STORE_NAME)) || "گالری طلا";
    const rows = order.invoice.items
      .map(
        (it) => `
        <tr>
          <td>${it.title}</td>
          <td>${it.weight}</td>
          <td>${fmt(it.goldPrice)}</td>
          <td>${fmt(it.wage)}</td>
          <td>${fmt(it.profit)}</td>
          <td>${fmt(it.tax)}</td>
          <td>${fmt(it.total)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاکتور ${order.invoice.invoiceNumber}</title>
<style>
  body { font-family: Tahoma, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 20px; }
  .meta { margin: 12px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
  th { background: #f5f5f5; }
  .totals { margin-top: 16px; font-size: 14px; }
  .totals div { margin: 4px 0; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <h1>${storeName}</h1>
  <div class="meta">
    <div>شماره فاکتور: ${order.invoice.invoiceNumber}</div>
    <div>شماره سفارش: ${order.orderNumber}</div>
    <div>مشتری: ${order.fullName} - ${order.phone}</div>
    <div>آدرس: ${order.province ?? ""} ${order.city} - ${order.address}</div>
    <div>تاریخ: ${order.createdAt.toLocaleDateString("fa-IR")}</div>
  </div>
  <table>
    <thead>
      <tr><th>کالا</th><th>وزن</th><th>طلا</th><th>اجرت</th><th>سود</th><th>مالیات</th><th>جمع</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div>جمع کالاها: ${fmt(order.itemsTotal)} ریال</div>
    ${order.giftBagPrice > 0n ? `<div>بگ هدیه: ${fmt(order.giftBagPrice)} ریال</div>` : ""}
    ${order.shippingCost > 0n ? `<div>هزینه ارسال: ${fmt(order.shippingCost)} ریال</div>` : ""}
    ${order.discountAmount > 0n ? `<div>تخفیف: ${fmt(order.discountAmount)} ریال</div>` : ""}
    <div><strong>مبلغ نهایی: ${fmt(order.total)} ریال</strong></div>
  </div>
  <button class="no-print" onclick="window.print()">چاپ</button>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(
    serializeBigInt({
      invoice: order.invoice,
      order: {
        orderNumber: order.orderNumber,
        fullName: order.fullName,
        phone: order.phone,
        address: order.address,
        city: order.city,
        province: order.province,
        itemsTotal: order.itemsTotal,
        giftBagPrice: order.giftBagPrice,
        shippingCost: order.shippingCost,
        discountAmount: order.discountAmount,
        total: order.total,
        createdAt: order.createdAt,
      },
    }),
  );
}
