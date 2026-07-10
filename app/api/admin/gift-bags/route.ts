import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { adminGiftBagCreateSchema, adminGiftBagUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_TYPES = ["NORMAL", "WOODEN", "VIP", "OCCASION"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const bags = await prisma.giftBag.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(serializeBigInt({ bags }));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminGiftBagCreateSchema, await req.json(), MSG.giftBag.titleRequired);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const bag = await prisma.giftBag.create({
      data: {
        type: body.type && VALID_TYPES.includes(body.type) ? body.type : "NORMAL",
        title: body.title,
        image: body.image ?? null,
        price: body.price ?? 0n,
        stock: body.stock ?? 0,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "GiftBag",
      entityId: bag.id,
      summary: `ایجاد بگ ${bag.title}`,
    });

    return apiSuccess(
      { bag: serializeBigInt(bag), message: MSG.giftBag.created },
      HTTP.CREATED,
    );
  } catch (err) {
    console.error("CREATE GIFT BAG ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminGiftBagUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, type, price, ...fields } = parsed.data;
    const existing = await prisma.giftBag.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.giftBag.notFound);

    const data: Prisma.GiftBagUpdateInput = pickDefined({
      ...fields,
      type: type && VALID_TYPES.includes(type) ? type : undefined,
      price: price !== undefined ? price ?? existing.price : undefined,
    }) as Prisma.GiftBagUpdateInput;

    const bag = await prisma.giftBag.update({ where: { id }, data });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "GiftBag",
      entityId: id,
      summary: `ویرایش بگ ${bag.title}`,
    });

    return apiSuccess({ bag: serializeBigInt(bag), message: MSG.giftBag.updated });
  } catch (err) {
    console.error("UPDATE GIFT BAG ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;

    try {
      await prisma.giftBag.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        await prisma.giftBag.update({ where: { id }, data: { isActive: false } });
      } else throw e;
    }

    await audit({
      req,
      ...getActor(auth.payload),
      action: "DELETE",
      entity: "GiftBag",
      entityId: id,
      summary: "حذف بگ",
    });

    return apiSuccess({ message: MSG.giftBag.deleted });
  } catch (err) {
    console.error("DELETE GIFT BAG ERROR", err);
    return ApiErr.internal();
  }
}
