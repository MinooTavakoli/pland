import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { uniqueSlug } from "@/lib/utils/slug";
import { getLatestGoldPrice, computeProductPrice } from "@/lib/catalog/gold";
import { audit, diff } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import {
  adminProductCreateSchema,
  adminProductUpdateSchema,
  idBodySchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_STATUS = ["DRAFT", "AVAILABLE", "UNAVAILABLE", "RESERVED", "SOLD", "INACTIVE"];
const VALID_GENDER = ["MALE", "FEMALE", "KIDS", "UNISEX"];

async function priceCacheFor(p: {
  weight: number;
  wage: number;
  profit: number;
  tax: number;
}): Promise<bigint | null> {
  const gp = await getLatestGoldPrice();
  if (!gp) return null;
  return computeProductPrice(p, gp).total;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.ProductWhereInput = {};
  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }
  const status = searchParams.get("status");
  if (status && VALID_STATUS.includes(status)) {
    where.status = status as Prisma.ProductWhereInput["status"];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        categories: { select: { id: true, title: true, slug: true } },
        tags: { select: { id: true, title: true } },
        occasions: { select: { id: true, title: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt(paginated(products, total, page)));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminProductCreateSchema, await req.json(), MSG.product.titleRequired);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;

    const codeExists = await prisma.product.findUnique({
      where: { code: body.code },
    });
    if (codeExists) return ApiErr.conflict(MSG.product.codeExists);

    const slug = await uniqueSlug(body.slug || body.title, async (s) =>
      Boolean(await prisma.product.findUnique({ where: { slug: s } })),
    );

    const weight = body.weight;
    const wage = body.wage;
    const profit = body.profit;
    const tax = body.tax;

    const status = body.status && VALID_STATUS.includes(body.status) ? body.status : "DRAFT";
    const gender = body.gender && VALID_GENDER.includes(body.gender) ? body.gender : "UNISEX";

    const priceCache = await priceCacheFor({ weight, wage, profit, tax });

    const product = await prisma.product.create({
      data: {
        code: body.code,
        slug,
        title: body.title,
        gender,
        weight,
        karat: body.karat,
        wage,
        profit,
        tax,
        stock: body.stock,
        priceCache,
        description: body.description ?? null,
        specs: body.specs ?? undefined,
        images: body.images,
        status,
        isGift: body.isGift ?? false,
        isNewCollection: body.isNewCollection ?? false,
        isFeatured: body.isFeatured ?? false,
        metaTitle: body.metaTitle ?? null,
        metaDesc: body.metaDesc ?? null,
        canonical: body.canonical ?? null,
        ogImage: body.ogImage ?? null,
        categories: { connect: body.categoryIds.map((id) => ({ id })) },
        tags: { connect: body.tagIds.map((id) => ({ id })) },
        occasions: { connect: body.occasionIds.map((id) => ({ id })) },
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      summary: `ایجاد محصول ${product.title}`,
    });

    return NextResponse.json(
      serializeBigInt({ ...product, message: MSG.product.created }),
      { status: HTTP.CREATED },
    );
  } catch (err) {
    console.error("CREATE PRODUCT ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminProductUpdateSchema, await req.json(), MSG.product.idRequired);
    if (!parsed.ok) return parsed.response;

    const { id, categoryIds, tagIds, occasionIds, code, ...fields } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.product.notFound);

    if (code && code !== existing.code) {
      const dup = await prisma.product.findUnique({ where: { code } });
      if (dup) return ApiErr.conflict(MSG.product.codeExists);
    }

    const weight = fields.weight ?? existing.weight;
    const wage = fields.wage ?? existing.wage;
    const profit = fields.profit ?? existing.profit;
    const tax = fields.tax ?? existing.tax;

    const data: Prisma.ProductUpdateInput = pickDefined({
      code,
      title: fields.title,
      gender: fields.gender && VALID_GENDER.includes(fields.gender) ? fields.gender : undefined,
      weight: fields.weight,
      karat: fields.karat,
      wage: fields.wage,
      profit: fields.profit,
      tax: fields.tax,
      stock: fields.stock,
      description: fields.description,
      specs: fields.specs,
      images: fields.images,
      status: fields.status && VALID_STATUS.includes(fields.status) ? fields.status : undefined,
      isGift: fields.isGift,
      isNewCollection: fields.isNewCollection,
      isFeatured: fields.isFeatured,
      metaTitle: fields.metaTitle,
      metaDesc: fields.metaDesc,
      canonical: fields.canonical,
      ogImage: fields.ogImage,
    }) as Prisma.ProductUpdateInput;

    if (
      fields.weight !== undefined ||
      fields.wage !== undefined ||
      fields.profit !== undefined ||
      fields.tax !== undefined
    ) {
      data.priceCache = await priceCacheFor({ weight, wage, profit, tax });
    }

    if (categoryIds !== undefined) {
      data.categories = { set: categoryIds.map((cid) => ({ id: cid })) };
    }
    if (tagIds !== undefined) {
      data.tags = { set: tagIds.map((tid) => ({ id: tid })) };
    }
    if (occasionIds !== undefined) {
      data.occasions = { set: occasionIds.map((oid) => ({ id: oid })) };
    }

    const product = await prisma.product.update({ where: { id }, data });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      summary: `ویرایش محصول ${product.title}`,
      changes: diff(
        existing as unknown as Record<string, unknown>,
        data as Record<string, unknown>,
      ),
    });

    return apiSuccess({ message: MSG.product.updated, product: serializeBigInt(product) });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.product.idRequired);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.product.notFound);

    try {
      await prisma.product.delete({ where: { id } });
      await audit({
        req,
        ...getActor(auth.payload),
        action: "DELETE",
        entity: "Product",
        entityId: id,
        summary: `حذف محصول ${existing.title}`,
      });
      return apiSuccess({ message: MSG.product.deleted });
    } catch (e) {
      // product referenced by orders/cart → soft-disable instead of hard delete
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
        await audit({
          req,
          ...getActor(auth.payload),
          action: "STATUS_CHANGE",
          entity: "Product",
          entityId: id,
          summary: `غیرفعال‌سازی محصول ${existing.title} (دارای سابقه سفارش)`,
        });
        return apiSuccess({ message: MSG.product.deleted });
      }
      throw e;
    }
  } catch (err) {
    console.error("DELETE PRODUCT ERROR", err);
    return ApiErr.internal();
  }
}
