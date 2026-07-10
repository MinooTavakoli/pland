import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const page = await prisma.staticPage.findUnique({ where: { slug } });
    if (!page || !page.isActive) return ApiErr.notFound(MSG.page.notFound);

    return NextResponse.json({
      page: {
        slug: page.slug,
        title: page.title,
        content: page.content,
      },
      seo: {
        metaTitle: page.metaTitle ?? page.title,
        metaDesc: page.metaDesc ?? null,
      },
    });
  } catch (err) {
    console.error("PAGE DETAIL ERROR", err);
    return ApiErr.internal();
  }
}
