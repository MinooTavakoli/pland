import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, serializeBigInt, getActor } from "@/lib/auth";
import { HTTP, MSG } from "@/lib/http/messages";
import { recomputeAllProductPrices } from "@/lib/catalog/gold";
import { audit } from "@/lib/admin/audit";
import { parseBody } from "@/lib/http/validation";
import { goldPricePostSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  const price = await prisma.goldPrice.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(serializeBigInt(price));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = parseBody(
    goldPricePostSchema,
    await req.json(),
    MSG.goldPrice.invalid,
  );
  if (!parsed.ok) return parsed.response;

  const { price } = parsed.data;

  const created = await prisma.goldPrice.create({ data: { price } });

  const updated = await recomputeAllProductPrices(price);

  await audit({
    req,
    ...getActor(auth.payload),
    action: "UPDATE",
    entity: "GoldPrice",
    entityId: created.id,
    summary: `به‌روزرسانی قیمت طلا و بازمحاسبه ${updated} محصول`,
  });

  return NextResponse.json(
    serializeBigInt({
      ...created,
      recomputed: updated,
      message: MSG.goldPrice.updated,
    }),
    { status: HTTP.CREATED },
  );
}
