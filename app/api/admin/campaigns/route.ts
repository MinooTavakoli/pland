import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, getActor } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { uniqueSlug } from "@/lib/utils/slug";
import { audit } from "@/lib/admin/audit";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { campaignCreateSchema, campaignUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(campaignCreateSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const slug = await uniqueSlug(body.slug || body.title, async (s) =>
      Boolean(await prisma.campaign.findUnique({ where: { slug: s } })),
    );

    const campaign = await prisma.campaign.create({
      data: {
        title: body.title,
        slug,
        banner: body.banner ?? null,
        description: body.description ?? null,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
        isActive: body.isActive ?? true,
        products: { connect: (body.productIds ?? []).map((id) => ({ id })) },
      },
    });

    await audit({
      req,
      ...getActor(auth.payload),
      action: "CREATE",
      entity: "Campaign",
      entityId: campaign.id,
      summary: `ایجاد کمپین ${campaign.title}`,
    });

    return apiSuccess({ campaign, message: MSG.campaign.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(campaignUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, productIds, ...fields } = parsed.data;
    const data: Prisma.CampaignUpdateInput = pickDefined(fields) as Prisma.CampaignUpdateInput;

    if (productIds !== undefined) {
      data.products = { set: productIds.map((pid) => ({ id: pid })) };
    }

    const campaign = await prisma.campaign.update({ where: { id }, data });
    return apiSuccess({ campaign, message: MSG.campaign.updated });
  } catch (err) {
    console.error("UPDATE CAMPAIGN ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.campaign.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.campaign.deleted });
  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR", err);
    return ApiErr.internal();
  }
}
