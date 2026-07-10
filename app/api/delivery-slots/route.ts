import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const slots = await prisma.deliverySlot.findMany({
    where: { isActive: true, date: { gte: startOfToday } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(slots.map((s) => ({ ...s, date: s.date.toISOString() })));
}
