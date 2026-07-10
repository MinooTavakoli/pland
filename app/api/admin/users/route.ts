import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { adminUserUpdateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.UserWhereInput = {};
  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { orders: { some: { orderNumber: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (searchParams.get("vip") === "true") where.isVip = true;
  if (searchParams.get("inactive") === "true") where.isActive = false;
  if (searchParams.get("role")) where.role = searchParams.get("role") as Prisma.UserWhereInput["role"];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isVip: true,
        isActive: true,
        totalSpent: true,
        ordersCount: true,
        createdAt: true,
        lastOrderAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(users, total, page)));
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminUserUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, ...fields } = parsed.data;
    const user = await prisma.user.update({
      where: { id },
      data: pickDefined(fields),
      select: { id: true, phone: true, isVip: true, isActive: true },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "User",
      entityId: id,
      summary: "ویرایش کاربر توسط ادمین",
    });

    return apiSuccess({ user, message: MSG.user.updated });
  } catch (err) {
    console.error("ADMIN USER UPDATE ERROR", err);
    return ApiErr.internal();
  }
}
