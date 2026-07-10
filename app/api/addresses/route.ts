import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { createAddressSchema, updateAddressSchema, deleteAddressSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const addresses = await prisma.address.findMany({
    where: { userId: getUserId(auth.payload) },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const userId = getUserId(auth.payload);
    const parsed = parseBody(createAddressSchema, await req.json(), MSG.address.incomplete);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const makeDefault = body.isDefault ?? false;
    if (makeDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        title: body.title ?? null,
        fullName: body.fullName ?? null,
        phone: body.phone ?? null,
        province: body.province ?? null,
        city: body.city,
        postal: body.postal,
        address: body.address,
        isDefault: makeDefault,
      },
    });

    return apiSuccess({ address, message: MSG.address.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE ADDRESS ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const userId = getUserId(auth.payload);
    const parsed = parseBody(updateAddressSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, isDefault: makeDefault, ...fields } = parsed.data;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return ApiErr.notFound(MSG.address.notFound);
    }

    if (makeDefault === true) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({
      where: { id },
      data: pickDefined({
        title: fields.title,
        fullName: fields.fullName,
        phone: fields.phone,
        province: fields.province,
        city: fields.city,
        postal: fields.postal,
        address: fields.address,
        isDefault: makeDefault,
      }),
    });

    return apiSuccess({ address, message: MSG.address.updated });
  } catch (err) {
    console.error("UPDATE ADDRESS ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const userId = getUserId(auth.payload);
    const parsed = parseBody(deleteAddressSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return ApiErr.notFound(MSG.address.notFound);
    }

    await prisma.address.delete({ where: { id } });
    return apiSuccess({ message: MSG.address.deleted });
  } catch (err) {
    console.error("DELETE ADDRESS ERROR", err);
    return ApiErr.internal();
  }
}
