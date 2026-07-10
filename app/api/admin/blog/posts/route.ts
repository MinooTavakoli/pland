import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor, getUserId } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { uniqueSlug } from "@/lib/utils/slug";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { blogPostCreateSchema, blogPostUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.BlogPostWhereInput = {};
  const q = searchParams.get("q")?.trim();
  if (q) where.title = { contains: q, mode: "insensitive" };
  const status = searchParams.get("status");
  if (status && ["DRAFT", "PUBLISHED"].includes(status)) {
    where.status = status as Prisma.BlogPostWhereInput["status"];
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        category: { select: { id: true, title: true } },
        tags: { select: { id: true, title: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json(paginated(posts, total, page));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(blogPostCreateSchema, await req.json(), MSG.blog.titleRequired);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const slug = await uniqueSlug(body.slug || body.title, async (s) =>
      Boolean(await prisma.blogPost.findUnique({ where: { slug: s } })),
    );

    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt ?? null,
        content: body.content,
        coverImage: body.coverImage ?? null,
        status,
        authorId: getUserId(auth.payload),
        categoryId: body.categoryId ?? null,
        metaTitle: body.metaTitle ?? null,
        metaDesc: body.metaDesc ?? null,
        articleSchema: body.articleSchema ?? undefined,
        faqSchema: body.faqSchema ?? undefined,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        tags: { connect: (body.tagIds ?? []).map((id) => ({ id })) },
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "BlogPost",
      entityId: post.id,
      summary: `ایجاد مقاله ${post.title}`,
    });

    return apiSuccess({ post, message: MSG.blog.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE POST ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(blogPostUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, status, categoryId, tagIds, ...fields } = parsed.data;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.blog.postNotFound);

    const data: Prisma.BlogPostUpdateInput = pickDefined(fields) as Prisma.BlogPostUpdateInput;

    if (status && ["DRAFT", "PUBLISHED"].includes(status)) {
      data.status = status;
      if (status === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }
    if (categoryId !== undefined) {
      data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    }
    if (tagIds !== undefined) {
      data.tags = { set: tagIds.map((tid) => ({ id: tid })) };
    }

    const post = await prisma.blogPost.update({ where: { id }, data });
    return apiSuccess({ post, message: MSG.blog.updated });
  } catch (err) {
    console.error("UPDATE POST ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.blogPost.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.blog.deleted });
  } catch (err) {
    console.error("DELETE POST ERROR", err);
    return ApiErr.internal();
  }
}
