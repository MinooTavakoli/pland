import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const badges = await prisma.trustBadge.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, image: true, link: true },
    });
    return NextResponse.json({ badges });
  } catch (err) {
    console.error("TRUST BADGES API ERROR", err);
    return ApiErr.internal();
  }
}
