import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import {
  deliverySlotCreateSchema,
  deliverySlotUpdateSchema,
  idBodySchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

function parseSlotDate(value: string | Date): Date | null {
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const slots = await prisma.deliverySlot.findMany({
    orderBy: { date: "asc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = parseBody(deliverySlotCreateSchema, await req.json(), MSG.delivery.incompleteInfo);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;
  const date = parseSlotDate(body.date);
  if (!date) return ApiErr.badRequest(MSG.delivery.incompleteInfo);

  const slot = await prisma.deliverySlot.create({
    data: {
      date,
      fromHour: body.fromHour,
      toHour: body.toHour,
      capacity: body.capacity ?? 20,
      isActive: body.isActive ?? true,
    },
  });

  await audit({
    req,
    ...getActor(auth.payload),
    action: "CREATE",
    entity: "DeliverySlot",
    entityId: slot.id,
    summary: "ایجاد بازه ارسال",
  });

  return apiSuccess({ slot: { ...slot, date: slot.date.toISOString() } }, HTTP.CREATED);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = parseBody(deliverySlotUpdateSchema, await req.json(), MSG.common.invalidId);
  if (!parsed.ok) return parsed.response;

  const { id, date: dateRaw, ...fields } = parsed.data;
  const slot = await prisma.deliverySlot.update({
    where: { id },
    data: pickDefined({
      ...fields,
      date: dateRaw !== undefined ? parseSlotDate(dateRaw) ?? undefined : undefined,
    }),
  });

  return apiSuccess({ slot: { ...slot, date: slot.date.toISOString() }, message: MSG.common.updated });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
  if (!parsed.ok) return parsed.response;

  const { id } = parsed.data;
  const used = await prisma.order.count({ where: { deliverySlotId: id } });
  if (used > 0) {
    await prisma.deliverySlot.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.deliverySlot.delete({ where: { id } });
  }

  return apiSuccess({ message: MSG.common.deleted });
}
