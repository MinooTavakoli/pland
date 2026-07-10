import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { getPagination, paginated } from "@/lib/http/pagination";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = getPagination(searchParams);

    const where: Prisma.BlogPostWhereInput = { status: "PUBLISHED" };
    const q = searchParams.get("q")?.trim();
    if (q) where.title = { contains: q, mode: "insensitive" };
    const category = searchParams.get("category");
    if (category) where.category = { slug: category };
    const tag = searchParams.get("tag");
    if (tag) where.tags = { some: { slug: tag } };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: page.skip,
        take: page.take,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          category: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json(paginated(posts, total, page));
  } catch (err) {
    console.error("BLOG LIST ERROR", err);
    return ApiErr.internal();
  }
}
