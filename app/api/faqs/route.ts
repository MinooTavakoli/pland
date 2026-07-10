import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, question: true, answer: true, category: true },
    });
    return NextResponse.json({ faqs });
  } catch (err) {
    console.error("FAQS API ERROR", err);
    return ApiErr.internal();
  }
}
