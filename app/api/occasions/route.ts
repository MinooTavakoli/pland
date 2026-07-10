import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const occasions = await prisma.occasion.findMany({
      where: { isActive: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    });
    return NextResponse.json({ occasions });
  } catch (err) {
    console.error("OCCASIONS API ERROR", err);
    return ApiErr.internal();
  }
}
