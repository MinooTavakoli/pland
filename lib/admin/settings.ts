import { prisma } from "@/lib/db";

/** Known setting keys with sensible defaults. */
export const SETTING_KEYS = {
  VIP_THRESHOLD: "vip_threshold", // مجموع خرید برای VIP شدن (تومان/ریال)
  STORE_NAME: "store_name",
  STORE_PHONE: "store_phone",
  DEFAULT_SHIPPING_COST: "default_shipping_cost",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.VIP_THRESHOLD]: "500000000", // 50,000,000 تومان (به ریال)
  [SETTING_KEYS.STORE_NAME]: "گالری طلای پادیمو",
  [SETTING_KEYS.STORE_PHONE]: "",
  [SETTING_KEYS.DEFAULT_SHIPPING_COST]: "0",
};

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  return DEFAULTS[key] ?? null;
}

export async function getSettingNumber(key: string): Promise<number> {
  const v = await getSetting(key);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getSettingBigInt(key: string): Promise<bigint> {
  const v = await getSetting(key);
  try {
    return v == null ? 0n : BigInt(v);
  } catch {
    return 0n;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const out: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}
