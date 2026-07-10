import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { bannerCreateSchema, bannerUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_POSITION = ["HOME_SLIDER", "AD_BANNER"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(bannerCreateSchema, await req.json(), MSG.banner.imageRequired);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const banner = await prisma.banner.create({
      data: {
        title: body.title ?? null,
        image: body.image,
        link: body.link ?? null,
        position: body.position && VALID_POSITION.includes(body.position) ? body.position : "HOME_SLIDER",
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "Banner",
      entityId: banner.id,
      summary: "ایجاد بنر",
    });

    return apiSuccess({ banner, message: MSG.banner.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE BANNER ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(bannerUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, position, ...fields } = parsed.data;
    const banner = await prisma.banner.update({
      where: { id },
      data: pickDefined({
        ...fields,
        position: position && VALID_POSITION.includes(position) ? position : undefined,
      }),
    });
    return apiSuccess({ banner, message: MSG.banner.updated });
  } catch (err) {
    console.error("UPDATE BANNER ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.banner.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.banner.deleted });
  } catch (err) {
    console.error("DELETE BANNER ERROR", err);
    return ApiErr.internal();
  }
}
