import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { parseBody } from "@/lib/http/validation";
import { blogTagCreateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const tags = await prisma.blogTag.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(blogTagCreateSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const { title, slug: slugInput } = parsed.data;
    const slug = await uniqueSlug(slugInput || title, async (s) =>
      Boolean(await prisma.blogTag.findUnique({ where: { slug: s } })),
    );
    const tag = await prisma.blogTag.create({ data: { title, slug } });
    return apiSuccess({ tag, message: MSG.common.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE BLOG TAG ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.blogTag.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.common.deleted });
  } catch (err) {
    console.error("DELETE BLOG TAG ERROR", err);
    return ApiErr.internal();
  }
}
