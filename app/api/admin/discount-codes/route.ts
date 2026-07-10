import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import {
  discountCodeCreateSchema,
  discountCodeUpdateSchema,
  idBodySchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const [codes, total] = await Promise.all([
    prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: { _count: { select: { usages: true, assignedUsers: true } } },
    }),
    prisma.discountCode.count(),
  ]);

  return NextResponse.json(serializeBigInt(paginated(codes, total, page)));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(discountCodeCreateSchema, await req.json(), MSG.discount.invalid);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const code = body.code.trim().toUpperCase();
    const exists = await prisma.discountCode.findUnique({ where: { code } });
    if (exists) return ApiErr.conflict(MSG.discount.codeExists);

    const assignedIds = body.assignedUserIds ?? [];

    const created = await prisma.discountCode.create({
      data: {
        code,
        type: body.type ?? "PERCENT",
        value: body.value,
        maxDiscount: body.maxDiscount ?? null,
        minOrder: body.minOrder ?? 0n,
        target: body.target ?? "ALL",
        usageLimit: body.usageLimit ?? null,
        perUserLimit: body.perUserLimit ?? 1,
        startsAt: body.startsAt ?? null,
        expiresAt: body.expiresAt ?? null,
        isActive: body.isActive ?? true,
        assignedUsers: assignedIds.length
          ? { connect: assignedIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "DiscountCode",
      entityId: created.id,
      summary: `ایجاد کد تخفیف ${code}`,
    });

    return apiSuccess({ code: serializeBigInt(created), message: MSG.discount.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE DISCOUNT ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(discountCodeUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, assignedUserIds, ...fields } = parsed.data;
    const data: Prisma.DiscountCodeUpdateInput = pickDefined(fields) as Prisma.DiscountCodeUpdateInput;

    if (assignedUserIds !== undefined) {
      data.assignedUsers = { set: assignedUserIds.map((i) => ({ id: i })) };
    }

    const code = await prisma.discountCode.update({ where: { id }, data });
    return apiSuccess({ code: serializeBigInt(code), message: MSG.common.updated });
  } catch (err) {
    console.error("UPDATE DISCOUNT ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.discountCode.update({
      where: { id: parsed.data.id },
      data: { isActive: false },
    });
    return apiSuccess({ message: MSG.common.deleted });
  } catch (err) {
    console.error("DELETE DISCOUNT ERROR", err);
    return ApiErr.internal();
  }
}
