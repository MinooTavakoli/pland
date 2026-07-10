import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { slugify } from "@/lib/utils/slug";
import { audit } from "@/lib/admin/audit";
import { parseBody } from "@/lib/http/validation";
import { staticPageSaveSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const pages = await prisma.staticPage.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ pages });
}

/** Upsert a static page by slug (about | contact | terms | privacy | ...). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(staticPageSaveSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const slug = slugify(body.slug);

    const page = await prisma.staticPage.upsert({
      where: { slug },
      update: {
        title: body.title,
        content: body.content,
        metaTitle: body.metaTitle ?? null,
        metaDesc: body.metaDesc ?? null,
        isActive: body.isActive ?? true,
      },
      create: {
        slug,
        title: body.title,
        content: body.content,
        metaTitle: body.metaTitle ?? null,
        metaDesc: body.metaDesc ?? null,
        isActive: body.isActive ?? true,
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "StaticPage",
      entityId: page.id,
      summary: `ذخیره صفحه ${slug}`,
    });

    return apiSuccess({ page, message: MSG.page.updated });
  } catch (err) {
    console.error("UPSERT PAGE ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.staticPage.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.common.deleted });
  } catch (err) {
    console.error("DELETE PAGE ERROR", err);
    return ApiErr.internal();
  }
}
