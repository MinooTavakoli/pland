import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import {
  adminCategoryCreateSchema,
  adminCategoryUpdateSchema,
  idBodySchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_GENDER = ["MALE", "FEMALE", "KIDS", "UNISEX"];

async function depthGuard(parentId: number | null): Promise<boolean> {
  if (!parentId) return true;
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    include: { parent: true },
  });
  if (!parent) return false;
  if (parent.parentId && parent.parent?.parentId) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminCategoryCreateSchema, await req.json(), MSG.category.nameRequired);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const title = (body.title ?? body.name ?? "").trim();
    const parentId = body.parentId ?? null;

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return ApiErr.badRequest(MSG.category.parentNotFound);
      if (!(await depthGuard(parentId))) return ApiErr.badRequest(MSG.category.maxDepth);
    }

    const slug = await uniqueSlug(body.slug || title, async (s) =>
      Boolean(await prisma.category.findUnique({ where: { slug: s } })),
    );

    const category = await prisma.category.create({
      data: {
        title,
        slug,
        parentId,
        gender: body.gender && VALID_GENDER.includes(body.gender) ? body.gender : null,
        image: body.image ?? null,
        description: body.description ?? null,
        metaTitle: body.metaTitle ?? null,
        metaDesc: body.metaDesc ?? null,
        seoContent: body.seoContent ?? null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "Category",
      entityId: category.id,
      summary: `ایجاد دسته‌بندی ${category.title}`,
    });

    return apiSuccess({ category, message: MSG.category.created }, HTTP.CREATED);
  } catch (error) {
    console.error("ADMIN CATEGORY POST ERROR", error);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminCategoryUpdateSchema, await req.json(), MSG.category.idRequired);
    if (!parsed.ok) return parsed.response;

    const { id, parentId, gender, ...fields } = parsed.data;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return ApiErr.notFound(MSG.category.notFound);

    if (parentId) {
      if (parentId === id) return ApiErr.badRequest(MSG.common.invalidInput);
      if (!(await depthGuard(parentId))) return ApiErr.badRequest(MSG.category.maxDepth);
    }

    const data: Prisma.CategoryUpdateInput = pickDefined({
      ...fields,
      title: fields.title?.trim() || fields.name?.trim() || undefined,
      gender:
        gender !== undefined
          ? gender && VALID_GENDER.includes(gender)
            ? gender
            : null
          : undefined,
    }) as Prisma.CategoryUpdateInput;

    if (parentId !== undefined) {
      data.parent = parentId ? { connect: { id: parentId } } : { disconnect: true };
    }

    const category = await prisma.category.update({ where: { id }, data });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "Category",
      entityId: id,
      summary: `ویرایش دسته‌بندی ${category.title}`,
    });

    return apiSuccess({ category, message: MSG.category.updated });
  } catch (error) {
    console.error("ADMIN CATEGORY PUT ERROR", error);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.category.idRequired);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) return ApiErr.conflict(MSG.category.hasChildren);

    await prisma.category.delete({ where: { id } });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "DELETE",
      entity: "Category",
      entityId: id,
      summary: "حذف دسته‌بندی",
    });

    return apiSuccess({ message: MSG.category.deleted });
  } catch (error) {
    console.error("ADMIN CATEGORY DELETE ERROR", error);
    return ApiErr.internal();
  }
}
