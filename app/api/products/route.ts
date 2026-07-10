import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { getLatestGoldPrice } from "@/lib/catalog/gold";
import { serializeProductCard, WAGE_TIERS, WageTier } from "@/lib/catalog/product";
import { getPagination, paginated } from "@/lib/http/pagination";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseQuery } from "@/lib/http/validation";
import { productsQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = getPagination(searchParams);
    const q = parseQuery(productsQuerySchema, searchParams);
    if (!q.ok) return q.response;

    const {
      q: searchQ,
      sort = "newest",
      categoryId,
      category: categorySlug,
      gender,
      occasion,
      occasionId,
      tagId,
      isNew,
      isFeatured,
      isGift,
      minWeight,
      maxWeight,
      wageTier,
      inStock,
      minPrice,
      maxPrice,
    } = q.data;

    const goldPrice = await getLatestGoldPrice();
    if (!goldPrice) return ApiErr.serviceUnavailable(MSG.goldPrice.notSet);

    const where: Prisma.ProductWhereInput = { status: "AVAILABLE" };
    const and: Prisma.ProductWhereInput[] = [];

    const trimmedQ = searchQ?.trim();
    if (trimmedQ) {
      and.push({
        OR: [
          { title: { contains: trimmedQ, mode: "insensitive" } },
          { code: { contains: trimmedQ, mode: "insensitive" } },
          { categories: { some: { title: { contains: trimmedQ, mode: "insensitive" } } } },
        ],
      });
    }

    if (categoryId) {
      and.push({
        categories: {
          some: { OR: [{ id: categoryId }, { parentId: categoryId }] },
        },
      });
    } else if (categorySlug) {
      and.push({ categories: { some: { slug: categorySlug } } });
    }

    if (gender) {
      where.gender = gender;
    }

    if (occasionId) and.push({ occasions: { some: { id: occasionId } } });
    else if (occasion) and.push({ occasions: { some: { slug: occasion } } });

    if (tagId) and.push({ tags: { some: { id: tagId } } });

    if (isNew === true) where.isNewCollection = true;
    if (isFeatured === true) where.isFeatured = true;
    if (isGift === true) where.isGift = true;

    if (inStock === true) where.stock = { gt: 0 };

    if (minWeight != null || maxWeight != null) {
      where.weight = {
        ...(minWeight != null ? { gte: minWeight } : {}),
        ...(maxWeight != null ? { lte: maxWeight } : {}),
      };
    }

    if (wageTier && WAGE_TIERS[wageTier as WageTier]) {
      const t = WAGE_TIERS[wageTier as WageTier];
      where.wage = { gte: t.min, lt: t.max };
    }

    if (minPrice != null || maxPrice != null) {
      where.priceCache = {
        ...(minPrice != null ? { gte: minPrice } : {}),
        ...(maxPrice != null ? { lte: maxPrice } : {}),
      };
    }

    if (and.length) where.AND = and;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "priceAsc"
          ? { priceCache: "asc" }
          : sort === "priceDesc"
            ? { priceCache: "desc" }
            : sort === "bestseller"
              ? { soldCount: "desc" }
              : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: {
          categories: {
            select: { id: true, title: true, slug: true, parentId: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const items = products.map((p) => serializeProductCard(p, goldPrice));
    return NextResponse.json(paginated(items, total, page));
  } catch (err) {
    console.error("PRODUCTS API ERROR", err);
    return ApiErr.internal();
  }
}
