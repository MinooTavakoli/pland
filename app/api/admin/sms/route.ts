import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPagination, paginated } from "@/lib/http/pagination";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = getPagination(searchParams);

  const where: Prisma.SmsMessageWhereInput = {};
  const type = searchParams.get("type");
  if (type) where.type = type as Prisma.SmsMessageWhereInput["type"];
  const phone = searchParams.get("phone");
  if (phone) where.phone = { contains: phone };

  const [messages, total] = await Promise.all([
    prisma.smsMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.take,
    }),
    prisma.smsMessage.count({ where }),
  ]);

  return NextResponse.json(paginated(messages, total, page));
}
