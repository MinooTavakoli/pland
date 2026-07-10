import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { audit, diff } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { adminOrderEditSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_STATUS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELED",
  "FAILED",
];

function optionalTrimmed(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t ? t : undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.OrderWhereInput = {};
  const status = searchParams.get("status");
  if (status && VALID_STATUS.includes(status)) {
    where.status = status as Prisma.OrderWhereInput["status"];
  }
  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { fullName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        deliverySlot: true,
        items: true,
        tx: true,
        giftBag: { select: { id: true, title: true } },
        user: { select: { id: true, phone: true, firstName: true, lastName: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(orders, total, page)));
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminOrderEditSchema, await req.json(), MSG.order.idRequired);
    if (!parsed.ok) return parsed.response;

    const {
      id,
      deliverySlotId,
      giftBagId,
      fullName,
      phone,
      city,
      postal,
      address,
      ...rest
    } = parsed.data;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.order.notFound);

    const data: Prisma.OrderUpdateInput = pickDefined({
      fullName: optionalTrimmed(fullName),
      phone: optionalTrimmed(phone),
      email: rest.email,
      province: rest.province,
      city: optionalTrimmed(city),
      postal: optionalTrimmed(postal),
      address: optionalTrimmed(address),
      note: rest.note,
      shippingMethod: rest.shippingMethod,
      shippingCost: rest.shippingCost ?? undefined,
      deliveryDate: rest.deliveryDate ?? undefined,
      deliveryTime: rest.deliveryTime,
      giftBagPrice: rest.giftBagPrice ?? undefined,
      discountAmount: rest.discountAmount ?? undefined,
      total: rest.total ?? undefined,
    }) as Prisma.OrderUpdateInput;

    if (deliverySlotId !== undefined) {
      data.deliverySlot = deliverySlotId ? { connect: { id: deliverySlotId } } : { disconnect: true };
    }
    if (giftBagId !== undefined) {
      data.giftBag = giftBagId ? { connect: { id: giftBagId } } : { disconnect: true };
    }

    const order = await prisma.order.update({ where: { id }, data });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      summary: `ویرایش سفارش ${order.orderNumber}`,
      changes: diff(
        existing as unknown as Record<string, unknown>,
        data as Record<string, unknown>,
      ),
    });

    return apiSuccess({ order: serializeBigInt(order), message: MSG.order.updated });
  } catch (err) {
    console.error("ADMIN ORDER UPDATE ERROR", err);
    return ApiErr.internal();
  }
}
