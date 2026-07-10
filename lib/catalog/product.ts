import { computeProductPrice, PriceBreakdown } from "@/lib/catalog/gold";

export const WAGE_TIERS = {
  low: { min: 0, max: 7 },
  mid: { min: 7, max: 15 },
  high: { min: 15, max: Number.MAX_SAFE_INTEGER },
} as const;

export type WageTier = keyof typeof WAGE_TIERS;

type ProductLike = {
  id: number;
  code: string;
  slug: string;
  title: string;
  gender: string;
  weight: number;
  karat: number;
  wage: number;
  profit: number;
  tax: number;
  stock: number;
  images: string[];
  status: string;
  isGift: boolean;
  isNewCollection: boolean;
  isFeatured: boolean;
  soldCount: number;
  priceCache?: bigint | null;
  createdAt: Date;
  categories?: { id: number; title: string; slug: string; parentId: number | null }[];
  tags?: { id: number; title: string; slug: string }[];
  occasions?: { id: number; title: string; slug: string }[];
  metaTitle?: string | null;
  metaDesc?: string | null;
  description?: string | null;
  specs?: unknown;
  canonical?: string | null;
  ogImage?: string | null;
};

function priceBlock(price: PriceBreakdown) {
  return {
    base: price.base.toString(),
    wage: price.wageAmount.toString(),
    profit: price.profitAmount.toString(),
    tax: price.taxAmount.toString(),
    total: price.total.toString(),
  };
}

/** Lightweight card for listings. */
export function serializeProductCard(p: ProductLike, goldPrice: bigint) {
  const price = computeProductPrice(p, goldPrice);
  return {
    id: p.id,
    code: p.code,
    slug: p.slug,
    title: p.title,
    gender: p.gender,
    weight: p.weight,
    karat: p.karat,
    images: p.images,
    status: p.status,
    stock: p.stock,
    inStock: p.stock > 0 && p.status === "AVAILABLE",
    isGift: p.isGift,
    isNewCollection: p.isNewCollection,
    isFeatured: p.isFeatured,
    soldCount: p.soldCount,
    createdAt: p.createdAt.toISOString(),
    price: price.total.toString(),
    priceDetail: priceBlock(price),
    categories:
      p.categories?.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        parentId: c.parentId,
      })) ?? [],
  };
}

/** Full detail for the product page. */
export function serializeProductDetail(p: ProductLike, goldPrice: bigint) {
  const price = computeProductPrice(p, goldPrice);
  return {
    ...serializeProductCard(p, goldPrice),
    wage: p.wage,
    profit: p.profit,
    tax: p.tax,
    description: p.description ?? null,
    specs: p.specs ?? null,
    tags: p.tags?.map((t) => ({ id: t.id, title: t.title, slug: t.slug })) ?? [],
    occasions:
      p.occasions?.map((o) => ({ id: o.id, title: o.title, slug: o.slug })) ?? [],
    seo: {
      metaTitle: p.metaTitle ?? p.title,
      metaDesc: p.metaDesc ?? null,
      canonical: p.canonical ?? null,
      ogImage: p.ogImage ?? p.images?.[0] ?? null,
      schema: buildProductSchema(p, price.total),
    },
  };
}

/** JSON-LD Product schema for SEO. */
export function buildProductSchema(p: ProductLike, total: bigint) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    sku: p.code,
    image: p.images,
    description: p.description ?? p.title,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: total.toString(),
      availability:
        p.stock > 0 && p.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}
