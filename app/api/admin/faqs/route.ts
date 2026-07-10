import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { parseBody, pickDefined } from "@/lib/http/validation";
import { faqCreateSchema, faqUpdateSchema, idBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(faqCreateSchema, await req.json(), MSG.common.missingFields);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const faq = await prisma.faq.create({
      data: {
        question: body.question,
        answer: body.answer,
        category: body.category ?? null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return apiSuccess({ faq, message: MSG.faq.created }, HTTP.CREATED);
  } catch (err) {
    console.error("CREATE FAQ ERROR", err);
    return ApiErr.internal();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(faqUpdateSchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    const { id, ...fields } = parsed.data;
    const faq = await prisma.faq.update({
      where: { id },
      data: pickDefined(fields),
    });
    return apiSuccess({ faq, message: MSG.faq.updated });
  } catch (err) {
    console.error("UPDATE FAQ ERROR", err);
    return ApiErr.internal();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = parseBody(idBodySchema, await req.json(), MSG.common.invalidId);
    if (!parsed.ok) return parsed.response;

    await prisma.faq.delete({ where: { id: parsed.data.id } });
    return apiSuccess({ message: MSG.faq.deleted });
  } catch (err) {
    console.error("DELETE FAQ ERROR", err);
    return ApiErr.internal();
  }
}
