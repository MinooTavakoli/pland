import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    });
    return NextResponse.json({ tags });
  } catch (err) {
    console.error("TAGS API ERROR", err);
    return ApiErr.internal();
  }
}
