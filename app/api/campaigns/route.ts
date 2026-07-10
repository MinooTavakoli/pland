import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        banner: true,
        description: true,
        startsAt: true,
        endsAt: true,
      },
    });
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("CAMPAIGNS API ERROR", err);
    return ApiErr.internal();
  }
}
