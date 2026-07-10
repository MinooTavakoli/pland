import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLatestGoldPrice } from "@/lib/catalog/gold";
import { serializeProductDetail, serializeProductCard } from "@/lib/catalog/product";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

const detailInclude = {
  categories: { select: { id: true, title: true, slug: true, parentId: true } },
  tags: { select: { id: true, title: true, slug: true } },
  occasions: { select: { id: true, title: true, slug: true } },
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    const byId = Number.isInteger(numericId) && numericId > 0;

    const goldPrice = await getLatestGoldPrice();
    if (!goldPrice) return ApiErr.serviceUnavailable(MSG.goldPrice.notSet);

    const product = await prisma.product.findFirst({
      where: byId ? { id: numericId } : { slug: id },
      include: detailInclude,
    });

    if (!product || product.status === "DRAFT" || product.status === "INACTIVE") {
      return ApiErr.notFound(MSG.product.notFound);
    }

    // increment view count (best-effort)
    prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    const categoryIds = product.categories.map((c) => c.id);
    const occasionIds = product.occasions.map((o) => o.id);

    const [similar, related, reviews, ratingAgg] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { not: product.id },
          status: "AVAILABLE",
          categories: { some: { id: { in: categoryIds } } },
        },
        take: 8,
        orderBy: { soldCount: "desc" },
        include: { categories: { select: { id: true, title: true, slug: true, parentId: true } } },
      }),
      occasionIds.length
        ? prisma.product.findMany({
            where: {
              id: { not: product.id },
              status: "AVAILABLE",
              occasions: { some: { id: { in: occasionIds } } },
            },
            take: 8,
            orderBy: { createdAt: "desc" },
            include: { categories: { select: { id: true, title: true, slug: true, parentId: true } } },
          })
        : Promise.resolve([]),
      prisma.review.findMany({
        where: { productId: product.id, status: "APPROVED" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.review.aggregate({
        where: { productId: product.id, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      product: serializeProductDetail(product, goldPrice),
      similar: similar.map((p) => serializeProductCard(p, goldPrice)),
      related: related.map((p) => serializeProductCard(p, goldPrice)),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        author: [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || "کاربر",
      })),
      rating: {
        average: ratingAgg._avg.rating ?? 0,
        count: ratingAgg._count,
      },
    });
  } catch (err) {
    console.error("PRODUCT DETAIL ERROR", err);
    return ApiErr.internal();
  }
}
