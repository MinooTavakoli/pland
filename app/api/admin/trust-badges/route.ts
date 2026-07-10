import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { trustBadgeCreateSchema, trustBadgeUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const badges = await prisma.trustBadge.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ badges });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(trustBadgeCreateSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const badge = await prisma.trustBadge.create({
      data: {
        title: body.title,
        image: body.image,
        link: body.link ?? null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return apiSuccess({ badge, message: MSG.trustBadge.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE TRUST BADGE ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(trustBadgeUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, ...fields } = parsed.data;
    const badge = await prisma.trustBadge.update({
      where: { id },
      data: pickDefined(fields),
    });
    return apiSuccess({ badge, message: MSG.trustBadge.updated });
  } catch (err) {
    console.error("UPDATE TRUST BADGE ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.trustBadge.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.trustBadge.deleted });
  } catch (err) {
    console.error("DELETE TRUST BADGE ERROR", err);
    return ApiErr.internal();
  }
}
