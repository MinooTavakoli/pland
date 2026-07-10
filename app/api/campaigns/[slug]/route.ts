import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLatestGoldPrice } from "@/lib/catalog/gold";
import { serializeProductCard } from "@/lib/catalog/product";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: "AVAILABLE" },
          include: {
            categories: { select: { id: true, title: true, slug: true, parentId: true } },
          },
        },
      },
    });

    if (!campaign || !campaign.isActive) {
      return ApiErr.notFound(MSG.campaign.notFound);
    }

    const goldPrice = await getLatestGoldPrice();
    const products = goldPrice
      ? campaign.products.map((p) => serializeProductCard(p, goldPrice))
      : [];

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        banner: campaign.banner,
        description: campaign.description,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
      },
      products,
    });
  } catch (err) {
    console.error("CAMPAIGN DETAIL ERROR", err);
    return ApiErr.internal();
  }
}
