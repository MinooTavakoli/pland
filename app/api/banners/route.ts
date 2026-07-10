import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();

    const where: Prisma.BannerWhereInput = {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    };
    const position = searchParams.get("position");
    if (position && ["HOME_SLIDER", "AD_BANNER"].includes(position)) {
      where.position = position as Prisma.BannerWhereInput["position"];
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: "asc" },
      select: { id: true, title: true, image: true, link: true, position: true },
    });
    return NextResponse.json({ banners });
  } catch (err) {
    console.error("BANNERS API ERROR", err);
    return ApiErr.internal();
  }
}
