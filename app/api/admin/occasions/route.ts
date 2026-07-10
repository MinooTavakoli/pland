import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { adminOccasionCreateSchema, adminOccasionUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const occasions = await prisma.occasion.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ occasions });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminOccasionCreateSchema, await req.json(), MSG.occasion.titleRequired);
    if (!parsed.ok) return parsed.response;

    const { title, slug: slugInput, isActive } = parsed.data;
    const slug = await uniqueSlug(slugInput || title, async (s) =>
      Boolean(await prisma.occasion.findUnique({ where: { slug: s } })),
    );

    const occasion = await prisma.occasion.create({
      data: { title, slug, isActive: isActive ?? true },
    });
    return apiSuccess({ occasion, message: MSG.occasion.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE OCCASION ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminOccasionUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, ...fields } = parsed.data;
    const occasion = await prisma.occasion.update({
      where: { id },
      data: pickDefined(fields),
    });
    return apiSuccess({ occasion, message: MSG.common.updated });
  } catch (err) {
    console.error("UPDATE OCCASION ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.occasion.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.occasion.deleted });
  } catch (err) {
    console.error("DELETE OCCASION ERROR", err);
    return ApiErr.internal();
  }
}
