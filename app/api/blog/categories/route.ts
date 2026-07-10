import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: { select: { posts: true } },
      },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("BLOG CATEGORIES API ERROR", err);
    return ApiErr.internal();
  }
}
