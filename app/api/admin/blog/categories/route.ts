import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { blogCategoryCreateSchema, blogCategoryUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const categories = await prisma.blogCategory.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(blogCategoryCreateSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const { title, slug: slugInput, metaTitle, metaDesc } = parsed.data;
    const slug = await uniqueSlug(slugInput || title, async (s) =>
      Boolean(await prisma.blogCategory.findUnique({ where: { slug: s } })),
    );

    const category = await prisma.blogCategory.create({
      data: {
        title,
        slug,
        metaTitle: metaTitle ?? null,
        metaDesc: metaDesc ?? null,
      },
    });
    return apiSuccess({ category, message: MSG.common.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE BLOG CATEGORY ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(blogCategoryUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, ...fields } = parsed.data;
    const category = await prisma.blogCategory.update({
      where: { id },
      data: pickDefined(fields),
    });
    return apiSuccess({ category, message: MSG.common.updated });
  } catch (err) {
    console.error("UPDATE BLOG CATEGORY ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.blogCategory.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.common.deleted });
  } catch (err) {
    console.error("DELETE BLOG CATEGORY ERROR", err);
    return ApiErr.internal();
  }
}
