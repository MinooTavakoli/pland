import { prisma } from "@/lib/db";
import { computeProductPrice } from "@/lib/catalog/gold";
import { validateDiscount } from "@/lib/commerce/discount";

export async function getOwnedCartItem(userId: number, cartItemId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  if (!cart) return null;
  const item = cart.items.find((i) => i.id === cartItemId);
  if (!item) return null;
  return { cart, item };
}

export async function getOwnedCartProduct(userId: number, productId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  if (!cart) return { cart: null, item: undefined };
  const item = cart.items.find((i) => i.productId === productId);
  return { cart, item };
}

/** Returns the user's cart, creating one if it does not yet exist. */
export async function ensureCart(userId: number) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

/**
 * Adds a product to the user's cart (or increments quantity). Validates that
 * the product is available and there is enough stock. Returns the cart item or
 * an error code the caller can translate to a response.
 */
export async function addToCart(
  userId: number,
  productId: number,
  quantity = 1,
): Promise<
  | { ok: true; itemId: number }
  | { ok: false; reason: "PRODUCT_NOT_FOUND" | "UNAVAILABLE" | "OUT_OF_STOCK" }
> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, reason: "PRODUCT_NOT_FOUND" };
  if (product.status !== "AVAILABLE") return { ok: false, reason: "UNAVAILABLE" };

  const cart = await ensureCart(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const nextQty = (existing?.quantity ?? 0) + Math.max(1, quantity);
  if (product.stock < nextQty) return { ok: false, reason: "OUT_OF_STOCK" };

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      })
    : await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: Math.max(1, quantity) },
      });

  return { ok: true, itemId: item.id };
}

export interface CartSummary {
  cartId: number | null;
  items: {
    cartItemId: number;
    productId: number;
    title: string;
    images: string[];
    weight: number;
    quantity: number;
    status: string;
    stock: number;
    inStock: boolean;
    unitPrice: string;
    totalPrice: string;
  }[];
  itemsTotal: bigint;
  bag: { id: number; title: string; price: string } | null;
  discount: { code: string; amount: string } | null;
  total: bigint;
}

/**
 * Builds a full cart summary: line items, subtotal, selected gift bag, applied
 * discount (re-validated) and grand total. Pure read — does not mutate.
 */
export async function summarizeCart(
  userId: number,
  goldPrice: bigint,
): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
      giftBag: true,
      discountCode: true,
    },
  });

  if (!cart) {
    return {
      cartId: null,
      items: [],
      itemsTotal: 0n,
      bag: null,
      discount: null,
      total: 0n,
    };
  }

  let itemsTotal = 0n;
  const items = cart.items.map((item) => {
    const p = item.product;
    const unit = computeProductPrice(p, goldPrice).total;
    const line = unit * BigInt(item.quantity);
    itemsTotal += line;
    return {
      cartItemId: item.id,
      productId: p.id,
      title: p.title,
      images: p.images,
      weight: p.weight,
      quantity: item.quantity,
      status: p.status,
      stock: p.stock,
      inStock: p.stock >= item.quantity && p.status === "AVAILABLE",
      unitPrice: unit.toString(),
      totalPrice: line.toString(),
    };
  });

  let bag: CartSummary["bag"] = null;
  let bagPrice = 0n;
  if (cart.giftBag && cart.giftBag.isActive && cart.giftBag.stock > 0) {
    bagPrice = cart.giftBag.price;
    bag = {
      id: cart.giftBag.id,
      title: cart.giftBag.title,
      price: cart.giftBag.price.toString(),
    };
  }

  let discount: CartSummary["discount"] = null;
  let discountAmount = 0n;
  if (cart.discountCode) {
    const res = await validateDiscount(cart.discountCode.code, userId, itemsTotal);
    if (res.ok) {
      discountAmount = res.amount;
      discount = { code: cart.discountCode.code, amount: res.amount.toString() };
    }
  }

  const total = itemsTotal + bagPrice - discountAmount;
  return { cartId: cart.id, items, itemsTotal, bag, discount, total };
}
