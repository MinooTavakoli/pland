import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeProductPrice, getLatestGoldPrice } from "@/lib/catalog/gold";
import { sendSms, smsTemplates } from "@/lib/integrations/sms";
import { getUserId, requireUser, serializeBigInt, getActor } from "@/lib/auth";
import { validateDiscount } from "@/lib/commerce/discount";
import { generateOrderNumber } from "@/lib/commerce/order";
import { getSettingBigInt, SETTING_KEYS } from "@/lib/admin/settings";
import { audit } from "@/lib/admin/audit";
import { ApiErr } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { parseBody } from "@/lib/http/validation";
import { checkoutSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const MOCK_BANK_NUMBER = process.env.MOCK_BANK_NUMBER || "6037991234567890";
const VALID_SHIPPING = ["COURIER", "POST", "TIPAX"];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.payload);
    const parsed = parseBody(checkoutSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const {
      fullName,
      phone,
      email,
      province,
      city,
      postal,
      address,
      birthDate,
      note,
      deliverySlotId,
      shippingMethod: shippingMethodRaw,
      paymentMethod: paymentMethodRaw,
    } = parsed.data;

    const shippingMethod = VALID_SHIPPING.includes(shippingMethodRaw ?? "")
      ? shippingMethodRaw!
      : "COURIER";
    const paymentMethod = paymentMethodRaw === "MANUAL" ? "MANUAL" : "ONLINE";

    const goldPrice = await getLatestGoldPrice();
    if (!goldPrice) return ApiErr.serviceUnavailable(MSG.goldPrice.notSet);

    const shippingCost = await getSettingBigInt(SETTING_KEYS.DEFAULT_SHIPPING_COST);

    // Load cart up front for discount validation
    const cartPreview = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
        giftBag: true,
        discountCode: true,
      },
    });
    if (!cartPreview || cartPreview.items.length === 0) {
      return ApiErr.badRequest(MSG.cart.empty);
    }

    // Pre-compute items total for discount validation
    let previewItemsTotal = 0n;
    for (const it of cartPreview.items) {
      previewItemsTotal +=
        computeProductPrice(it.product, goldPrice).total * BigInt(it.quantity);
    }

    let discountCodeId: number | null = null;
    let discountAmount = 0n;
    if (cartPreview.discountCode) {
      const res = await validateDiscount(
        cartPreview.discountCode.code,
        userId,
        previewItemsTotal,
      );
      if (res.ok) {
        discountCodeId = res.codeId;
        discountAmount = res.amount;
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } }, giftBag: true },
      });
      if (!cart || cart.items.length === 0) throw new Error("EMPTY_CART");

      // delivery slot
      let slotSnapshot: { id: number; date: Date; time: string } | null = null;
      if (deliverySlotId) {
        const slot = await tx.deliverySlot.findUnique({
          where: { id: Number(deliverySlotId) },
        });
        if (!slot || !slot.isActive) throw new Error("INVALID_SLOT");
        const used = await tx.order.count({ where: { deliverySlotId: slot.id } });
        if (used >= slot.capacity) throw new Error("SLOT_FULL");
        slotSnapshot = {
          id: slot.id,
          date: slot.date,
          time: `${slot.fromHour}-${slot.toHour}`,
        };
      }

      // items: validate, reserve stock, build breakdown
      let itemsTotal = 0n;
      const orderItems = [] as {
        productId: number;
        title: string;
        weight: number;
        price: bigint;
        goldBase: bigint;
        wageAmount: bigint;
        profitAmount: bigint;
        taxAmount: bigint;
        quantity: number;
      }[];

      for (const item of cart.items) {
        const product = item.product;
        if (product.status !== "AVAILABLE") {
          throw new Error(`UNAVAILABLE:${product.title}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`OUT_OF_STOCK:${product.title}`);
        }

        const price = computeProductPrice(product, goldPrice);
        itemsTotal += price.total * BigInt(item.quantity);

        orderItems.push({
          productId: product.id,
          title: product.title,
          weight: product.weight,
          price: price.total,
          goldBase: price.base,
          wageAmount: price.wageAmount,
          profitAmount: price.profitAmount,
          taxAmount: price.taxAmount,
          quantity: item.quantity,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // gift bag
      let giftBagId: number | null = null;
      let giftBagPrice = 0n;
      if (cart.giftBag && cart.giftBag.isActive && cart.giftBag.stock > 0) {
        giftBagId = cart.giftBag.id;
        giftBagPrice = cart.giftBag.price;
        await tx.giftBag.update({
          where: { id: cart.giftBag.id },
          data: { stock: { decrement: 1 } },
        });
      }

      // re-clamp discount to current items total
      let appliedDiscount = discountAmount;
      if (appliedDiscount > itemsTotal) appliedDiscount = itemsTotal;

      const total = itemsTotal + giftBagPrice + shippingCost - appliedDiscount;

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: "PENDING",
          fullName,
          phone,
          email: email || null,
          province: province || null,
          city,
          postal,
          address,
          birthDate: birthDate ?? null,
          note: note || null,
          shippingMethod,
          shippingCost,
          deliverySlotId: slotSnapshot?.id ?? null,
          deliveryDate: slotSnapshot?.date ?? null,
          deliveryTime: slotSnapshot?.time ?? null,
          giftBagId,
          giftBagPrice,
          discountCodeId,
          discountAmount: appliedDiscount,
          goldPriceSnapshot: goldPrice,
          itemsTotal,
          total,
          items: { create: orderItems },
          tx: {
            create: {
              method: paymentMethod,
              amount: total,
              status: "PENDING",
              bankNumber: paymentMethod === "MANUAL" ? MOCK_BANK_NUMBER : null,
            },
          },
        },
        include: { items: true, tx: true },
      });

      // record coupon usage
      if (discountCodeId) {
        await tx.couponUsage.create({
          data: { codeId: discountCodeId, userId, orderId: created.id },
        });
        await tx.discountCode.update({
          where: { id: discountCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { giftBagId: null, discountCodeId: null },
      });

      // slot capacity
      if (slotSnapshot) {
        const used = await tx.order.count({ where: { deliverySlotId: slotSnapshot.id } });
        const slot = await tx.deliverySlot.findUnique({ where: { id: slotSnapshot.id } });
        if (slot && used >= slot.capacity) {
          await tx.deliverySlot.update({
            where: { id: slot.id },
            data: { isActive: false },
          });
        }
      }

      return created;
    });

    await sendSms(order.phone, smsTemplates.orderPlaced(order.orderNumber), "ORDER", order.id);
    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "Order",
      entityId: order.id,
      summary: `ثبت سفارش ${order.orderNumber}`,
    });

    return NextResponse.json(
      serializeBigInt({ order, message: MSG.order.created }),
      { status: HTTP.CREATED },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "EMPTY_CART") return ApiErr.badRequest(MSG.cart.empty);
    if (message === "INVALID_SLOT") return ApiErr.badRequest(MSG.delivery.invalidSlot);
    if (message === "SLOT_FULL") return ApiErr.conflict(MSG.delivery.slotFull);
    if (message.startsWith("UNAVAILABLE:")) {
      return ApiErr.unprocessable(MSG.product.unavailable(message.split(":")[1]));
    }
    if (message.startsWith("OUT_OF_STOCK:")) {
      return ApiErr.conflict(MSG.product.outOfStock(message.split(":")[1]));
    }
    console.error("CHECKOUT ERROR", error);
    return ApiErr.internal();
  }
}
