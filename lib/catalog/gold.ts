import { prisma } from "@/lib/db";

export interface PriceBreakdown {
  base: bigint; // ارزش طلای خام
  wageAmount: bigint; // اجرت
  profitAmount: bigint; // سود
  taxAmount: bigint; // مالیات بر ارزش افزوده
  total: bigint;
}

/**
 * Legacy helper (kept for backward compatibility). Computes a simple price
 * where `profit` and `wage` are treated as percentages of the gold base.
 */
export function calculateGoldPrice({
  weight,
  goldPrice,
  profit = 0,
  wage = 0,
}: {
  weight: number;
  goldPrice: bigint;
  profit?: number;
  wage?: number;
}): PriceBreakdown {
  if (!goldPrice || weight <= 0) {
    return { base: 0n, wageAmount: 0n, profitAmount: 0n, taxAmount: 0n, total: 0n };
  }
  const base = BigInt(Math.round(weight * Number(goldPrice)));
  const wageAmount = (base * BigInt(Math.round(wage))) / 100n;
  const taxAmount = (base * BigInt(Math.round(profit || 0))) / 100n;
  const total = base + wageAmount + taxAmount;
  return { base, wageAmount, profitAmount: 0n, taxAmount, total };
}

/**
 * Standard product pricing:
 *   base   = weight × goldPrice
 *   wage   = base × wage%
 *   profit = (base + wage) × profit%
 *   tax    = (wage + profit) × tax%   (مالیات بر ارزش افزوده روی اجرت و سود)
 *   total  = base + wage + profit + tax
 */
export function computeProductPrice(
  product: { weight: number; wage: number; profit: number; tax: number },
  goldPrice: bigint,
): PriceBreakdown {
  if (!goldPrice || product.weight <= 0) {
    return { base: 0n, wageAmount: 0n, profitAmount: 0n, taxAmount: 0n, total: 0n };
  }
  const round = (n: number) => BigInt(Math.round(n));
  const baseNum = product.weight * Number(goldPrice);
  const base = round(baseNum);
  const wageAmount = round(baseNum * (product.wage || 0) / 100);
  const profitAmount = round(
    (baseNum + Number(wageAmount)) * (product.profit || 0) / 100,
  );
  const taxAmount = round(
    (Number(wageAmount) + Number(profitAmount)) * (product.tax || 0) / 100,
  );
  const total = base + wageAmount + profitAmount + taxAmount;
  return { base, wageAmount, profitAmount, taxAmount, total };
}

/** Returns the latest registered gold price, or null when none is set. */
export async function getLatestGoldPrice(): Promise<bigint | null> {
  const row = await prisma.goldPrice.findFirst({ orderBy: { createdAt: "desc" } });
  return row ? row.price : null;
}

/**
 * Recomputes and stores `priceCache` for all products based on the latest
 * gold price. Used after a gold price update so sorting/filtering by price
 * stays accurate. Returns the number of products updated.
 */
export async function recomputeAllProductPrices(
  goldPrice?: bigint,
): Promise<number> {
  const price = goldPrice ?? (await getLatestGoldPrice());
  if (!price) return 0;

  const products = await prisma.product.findMany({
    select: { id: true, weight: true, wage: true, profit: true, tax: true },
  });

  let count = 0;
  for (const p of products) {
    const { total } = computeProductPrice(p, price);
    await prisma.product.update({
      where: { id: p.id },
      data: { priceCache: total },
    });
    count += 1;
  }
  return count;
}
