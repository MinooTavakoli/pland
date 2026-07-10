import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { parseBody } from "@/lib/http/validation";
import { adminTagCreateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const tags = await prisma.tag.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminTagCreateSchema, await req.json(), MSG.tag.titleRequired);
    if (!parsed.ok) return parsed.response;

    const { title, slug: slugInput } = parsed.data;
    const slug = await uniqueSlug(slugInput || title, async (s) =>
      Boolean(await prisma.tag.findUnique({ where: { slug: s } })),
    );

    const tag = await prisma.tag.create({ data: { title, slug } });
    return apiSuccess({ tag, message: MSG.tag.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE TAG ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.tag.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.tag.deleted });
  } catch (err) {
    console.error("DELETE TAG ERROR", err);
    return ApiErr.internal();
  }
}
