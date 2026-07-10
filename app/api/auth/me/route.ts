import { NextRequest, NextResponse } from "next/server";
import { requireUser, getUserId, serializeBigInt } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { updateProfileSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: getUserId(auth.payload) },
      select: {
        id: true,
        phone: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        isVip: true,
        totalSpent: true,
        ordersCount: true,
        createdAt: true,
      },
    });

    if (!user) return ApiErr.notFound(MSG.auth.userNotFound);

    return NextResponse.json(serializeBigInt({ user }));
  } catch (err) {
    console.error("AUTH ME ERROR", err);
    return ApiErr.internal();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = parseBody(updateProfileSchema, await req.json());
    if (!parsed.ok) return parsed.response;

    const data = pickDefined(parsed.data);

    const user = await prisma.user.update({
      where: { id: getUserId(auth.payload) },
      data,
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
      },
    });

    return apiSuccess({ message: MSG.profile.updated, user: serializeBigInt(user) });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR", err);
    return ApiErr.internal();
  }
}
