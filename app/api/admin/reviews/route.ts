import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { getPagination, paginated } from "@/lib/http/pagination";
import { audit } from "@/lib/admin/audit";
import { parseBody } from "@/lib/http/validation";
import { adminReviewActionSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

const VALID_STATUS = ["PENDING", "APPROVED", "REJECTED"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.ReviewWhereInput = {};
  const status = searchParams.get("status");
  if (status && VALID_STATUS.includes(status)) {
    where.status = status as Prisma.ReviewWhereInput["status"];
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
      include: {
        product: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json(paginated(reviews, total, page));
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(adminReviewActionSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, action } = parsed.data;
    const status = action === "approve" ? "APPROVED" : "REJECTED";

    const review = await prisma.review.update({ where: { id }, data: { status } });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "STATUS_CHANGE",
      entity: "Review",
      entityId: id,
      summary: `${status === "APPROVED" ? "تأیید" : "رد"} نظر`,
    });

    return apiSuccess({
      review,
      message: status === "APPROVED" ? MSG.review.approved : MSG.review.rejected,
    });
  } catch (err) {
    console.error("MODERATE REVIEW ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
  if (!parsed.ok) return parsed.response;

  await prisma.review.delete({ where: { id: parsed.data.id } });
  return apiSuccess({ message: MSG.common.deleted });
}
