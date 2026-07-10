/**
 * Per-route OpenAPI success response examples (aligned with app/api handlers).
 * Applied in lib/openapi/index.ts after paths are built.
 */

import { responseExamples } from "./examples";
import { nestedItemsExamples, paginatedExamples } from "./paginated-examples";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** Routes that reuse detailed examples from examples.ts */
const ALIASED_EXAMPLES: Record<string, Partial<Record<HttpMethod, object>>> = {
  "/api/products": { get: responseExamples.paginatedProducts },
  "/api/products/{id}": { get: responseExamples.productDetail },
  "/api/categories": { get: responseExamples.categoryTree },
  "/api/gift-bags": { get: responseExamples.giftBags },
  "/api/banners": { get: responseExamples.banners },
  "/api/faqs": { get: responseExamples.faqs },
  "/api/trust-badges": { get: responseExamples.trustBadges },
  "/api/blog/categories": { get: responseExamples.blogCategories },
  "/api/campaigns": { get: responseExamples.campaigns },
  "/api/wishlist": { get: responseExamples.wishlist },
  "/api/delivery-slots": { get: responseExamples.deliverySlots },
  "/api/delivery-slots/active": { get: responseExamples.deliverySlots },
};

const S = { success: true, message: "Operation completed successfully" };

const idName = (id: number, title: string) => ({ id, title });

/** path → method → JSON example for 200/201 application/json */
export const ROUTE_SUCCESS_EXAMPLES: Record<
  string,
  Partial<Record<HttpMethod, object>>
> = {
  "/api/auth/send-otp": { post: { success: true, message: "OTP sent" } },
  "/api/auth/verify-otp": {
    post: {
      success: true,
      message: "Login successful",
      user: { id: 1, phone: "09121234567", role: "USER", firstName: null, lastName: null },
    },
  },
  "/api/auth/login": {
    post: { success: true, message: "Login successful", token: "<jwt>" },
  },
  "/api/auth/logout": { post: S },
  "/api/auth/me": {
    get: {
      user: {
        id: 1,
        phone: "09121234567",
        role: "USER",
        firstName: "Ali",
        lastName: "Rezaei",
        email: null,
        birthDate: null,
        isVip: false,
        totalSpent: "0",
        ordersCount: 0,
        createdAt: "2026-06-04T12:00:00.000Z",
      },
    },
    patch: {
      success: true,
      message: "Profile updated",
      user: { id: 1, phone: "09121234567", firstName: "Ali", lastName: "Rezaei", email: null, birthDate: null },
    },
  },

  "/api/tags": { get: { tags: [{ id: 1, title: "Bestseller", slug: "bestseller" }] } },
  "/api/occasions": { get: { occasions: [{ id: 1, title: "Valentine", slug: "valentine" }] } },
  "/api/gold-price": {
    get: { id: 1, price: "75000000", createdAt: "2026-06-04T12:00:00.000Z" },
    post: {
      id: 2,
      price: "76000000",
      createdAt: "2026-06-04T13:00:00.000Z",
      recomputed: 10,
      message: "Gold price updated",
    },
  },

  "/api/cart": {
    get: {
      items: [
        {
          cartItemId: 1,
          productId: 1,
          title: "Gold ring",
          images: [],
          weight: 3.2,
          quantity: 1,
          status: "AVAILABLE",
          stock: 4,
          inStock: true,
          unitPrice: "283294800",
          totalPrice: "283294800",
        },
      ],
      bag: null,
      discount: null,
      itemsTotal: "283294800",
      cartTotal: "283294800",
    },
  },
  "/api/cart/add": { post: S },
  "/api/cart/update": { post: S },
  "/api/cart/increase": { post: S },
  "/api/cart/decrease": { post: S },
  "/api/cart/remove": { delete: S },
  "/api/cart/clear": { post: S },
  "/api/cart/bag": { post: { success: true, message: "Gift bag selected" }, delete: { success: true, message: "Gift bag removed" } },
  "/api/cart/discount": {
    post: { message: "Discount applied", discount: { code: "SPRING10", amount: "5000000" }, cartTotal: "278294800" },
    delete: S,
  },

  "/api/wishlist": {
    post: S,
    delete: S,
  },
  "/api/wishlist/move-to-cart": { post: S },

  "/api/order/checkout": {
    post: {
      order: {
        id: 1,
        orderNumber: "PD-20260604-1234",
        status: "PENDING",
        total: "561589600",
        paymentMethod: "ONLINE",
      },
      message: "Order created",
    },
  },
  "/api/order/confirm": {
    post: { success: true, message: "Payment confirmed", orderId: 1, paid: true, trackingCode: "TRK123" },
  },
  "/api/order/payment/upload": {
    post: { success: true, message: "Receipt uploaded", tx: { id: 1, orderId: 1, status: "PENDING", method: "MANUAL" } },
  },
  "/api/order/{orderId}": {
    get: {
      ...paginatedExamples.userOrders.items[0],
      items: nestedItemsExamples.orderDetailItems,
    },
  },
  "/api/orders": { get: paginatedExamples.userOrders },
  "/api/invoice": {
    get: {
      invoice: { orderNumber: "PD-20260604-1234", total: "561589600" },
      order: { id: 1, status: "PAID" },
    },
  },
  "/api/reviews": {
    get: { reviews: [{ id: 1, rating: 5, comment: "Great", product: { id: 1, title: "Ring", slug: "product-1" } }] },
    post: { success: true, message: "Review submitted" },
  },

  "/api/dashboard": {
    get: {
      profile: { firstName: "Ali", lastName: "Rezaei", isVip: false },
      stats: { totalOrders: 1, paidOrders: 1, totalSpent: "561589600", wishlistCount: 0 },
      recentOrders: [
        { id: 1, orderNumber: "PD-20260604-1234", status: "PAID", total: "561589600", createdAt: "2026-06-04T12:00:00.000Z" },
      ],
    },
  },
  "/api/addresses": {
    get: { addresses: [{ id: 1, city: "Tehran", postal: "1234567890", address: "Street 1", isDefault: true }] },
    post: { success: true, message: "Address created", address: { id: 1, city: "Tehran", isDefault: false } },
    put: { success: true, message: "Address updated", address: { id: 1, city: "Tehran", isDefault: true } },
    delete: S,
  },

  "/api/blog/posts": { get: paginatedExamples.publicBlogPosts },
  "/api/blog/posts/{slug}": {
    get: { post: { id: 1, title: "News", slug: "news", content: "..." }, seo: { metaTitle: "News" } },
  },
  "/api/pages/{slug}": {
    get: { page: { slug: "about", title: "About us", content: "..." }, seo: { metaTitle: "About" } },
  },
  "/api/campaigns/{slug}": {
    get: {
      campaign: {
        id: 1,
        title: "جشنواره بهار",
        slug: "spring-sale",
        banner: null,
        description: null,
        startsAt: "2026-03-01T00:00:00.000Z",
        endsAt: "2026-06-30T23:59:59.000Z",
      },
      products: nestedItemsExamples.campaignProducts,
    },
  },

  "/api/admin/login": { post: { success: true, message: "Admin login successful" } },
  "/api/admin/logout": { post: S },
  "/api/admin/dashboard": {
    get: {
      sales: { today: "561589600", week: "561589600", month: "561589600", year: "561589600" },
      orders: { total: 1, pending: 0, pendingPayments: 0 },
      users: { total: 2, newToday: 2, newThisWeek: 2 },
      products: { lowStock: 0 },
    },
  },
  "/api/admin/products": {
    get: paginatedExamples.adminProducts,
    post: { id: 1, code: "PD-1001", title: "Gold ring", slug: "product-1", message: "Product created" },
    put: { success: true, message: "Product updated", product: { id: 1, title: "Gold ring" } },
    delete: S,
  },
  "/api/admin/categories": {
    get: { categories: [{ id: 1, title: "Women", slug: "women", _count: { products: 5, children: 8 } }] },
    post: { success: true, message: "Category created", category: idName(1, "Women") },
    put: { success: true, message: "Category updated", category: idName(1, "Women") },
    delete: S,
  },
  "/api/admin/tags": {
    get: { tags: [{ id: 1, title: "Tag", slug: "tag" }] },
    post: { success: true, message: "Tag created", tag: idName(1, "Tag") },
    delete: S,
  },
  "/api/admin/occasions": {
    get: { occasions: [{ id: 1, title: "Valentine", slug: "valentine", isActive: true }] },
    post: { success: true, message: "Occasion created", occasion: idName(1, "Valentine") },
    put: { success: true, message: "Occasion updated", occasion: idName(1, "Valentine") },
    delete: S,
  },
  "/api/admin/gift-bags": {
    get: { bags: [{ id: 1, type: "NORMAL", title: "Classic bag", price: "150000", stock: 10, isActive: true }] },
    post: { success: true, message: "Gift bag created", bag: { id: 1, title: "Classic bag" } },
    put: { success: true, message: "Gift bag updated", bag: { id: 1, title: "Classic bag" } },
    delete: S,
  },
  "/api/admin/orders": {
    get: paginatedExamples.adminOrders,
    put: { success: true, message: "Order updated", order: { id: 1, orderNumber: "PD-20260604-1234" } },
  },
  "/api/admin/orders/status": {
    post: { success: true, message: "Status updated", order: { id: 1, status: "SHIPPED" } },
  },
  "/api/admin/orders/payment/confirm": {
    post: { success: true, message: "Payment confirmed", trackingCode: "TRK123" },
  },
  "/api/admin/orders/list": {
    get: [{ id: 1, orderNumber: "PD-20260604-1234", status: "PAID", total: "561589600" }],
  },
  "/api/admin/users": {
    get: paginatedExamples.adminUsers,
    put: { success: true, message: "User updated", user: { id: 1, phone: "09121234567", isVip: true } },
  },
  "/api/admin/users/{id}": {
    get: {
      user: { id: 1, phone: "09121234567", firstName: "Ali", lastName: "Rezaei" },
      stats: { totalOrders: 1, totalSpent: "561589600" },
      orders: [{ id: 1, orderNumber: "PD-20260604-1234", status: "PAID", total: "561589600" }],
    },
  },
  "/api/admin/delivery-slots": {
    get: { slots: [{ id: 1, date: "2026-06-10T00:00:00.000Z", fromHour: "09:00", toHour: "12:00", capacity: 20, isActive: true }] },
    post: { success: true, message: "Slot created", slot: { id: 1, date: "2026-06-10T00:00:00.000Z" } },
    put: { success: true, message: "Slot updated", slot: { id: 1, capacity: 25 } },
    delete: S,
  },
  "/api/admin/discount-codes": {
    get: paginatedExamples.adminDiscountCodes,
    post: { success: true, message: "Code created", code: { id: 1, code: "SPRING10", type: "PERCENT", value: 10 } },
    put: { success: true, message: "Code updated", code: { id: 1, code: "SPRING10" } },
    delete: S,
  },
  "/api/admin/discount-codes/send": {
    post: { success: true, message: "Codes sent", count: 5 },
  },
  "/api/admin/campaigns": {
    get: { campaigns: [{ id: 1, title: "Spring", slug: "spring-sale", isActive: true }] },
    post: { success: true, message: "Campaign created", campaign: { id: 1, title: "Spring" } },
    put: { success: true, message: "Campaign updated", campaign: { id: 1, title: "Spring" } },
    delete: S,
  },
  "/api/admin/banners": {
    get: { banners: [{ id: 1, title: "Slider", image: "/storage/banners/1.jpg", position: "HOME_SLIDER", isActive: true }] },
    post: { success: true, message: "Banner created", banner: { id: 1, title: "Slider" } },
    put: { success: true, message: "Banner updated", banner: { id: 1, title: "Slider" } },
    delete: S,
  },
  "/api/admin/faqs": {
    get: { faqs: [{ id: 1, question: "How to order?", answer: "...", order: 0, isActive: true }] },
    post: { success: true, message: "FAQ created", faq: { id: 1, question: "How to order?" } },
    put: { success: true, message: "FAQ updated", faq: { id: 1, question: "How to order?" } },
    delete: S,
  },
  "/api/admin/trust-badges": {
    get: { badges: [{ id: 1, title: "Trust", image: "/storage/badges/1.png", isActive: true }] },
    post: { success: true, message: "Badge created", badge: { id: 1, title: "Trust" } },
    put: { success: true, message: "Badge updated", badge: { id: 1, title: "Trust" } },
    delete: S,
  },
  "/api/admin/blog/posts": {
    get: paginatedExamples.adminBlogPosts,
    post: { success: true, message: "Post created", post: { id: 1, title: "Article", slug: "article" } },
    put: { success: true, message: "Post updated", post: { id: 1, title: "Article" } },
    delete: S,
  },
  "/api/admin/blog/categories": {
    get: { categories: [{ id: 1, title: "News", slug: "news", _count: { posts: 3 } }] },
    post: { success: true, message: "Category created", category: idName(1, "News") },
    put: { success: true, message: "Category updated", category: idName(1, "News") },
    delete: S,
  },
  "/api/admin/blog/tags": {
    get: { tags: [{ id: 1, title: "Tag", slug: "tag" }] },
    post: { success: true, message: "Tag created", tag: idName(1, "Tag") },
    delete: S,
  },
  "/api/admin/pages": {
    get: { pages: [{ id: 1, slug: "about", title: "About", isActive: true }] },
    post: { success: true, message: "Page saved", page: { id: 1, slug: "about", title: "About" } },
    delete: S,
  },
  "/api/admin/upload": {
    post: { success: true, message: "Files uploaded", urls: ["/storage/products/img.jpg"] },
  },
  "/api/admin/reviews": {
    get: paginatedExamples.adminReviews,
    put: { success: true, message: "Review updated", review: { id: 1, status: "APPROVED" } },
    delete: S,
  },
  "/api/admin/transactions": { get: paginatedExamples.adminTransactions },
  "/api/admin/send-delivery-sms": { post: { success: true, message: "SMS sent" } },
  "/api/admin/reports/sales": {
    get: {
      groupBy: "day",
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-04T23:59:59.999Z",
      totalRevenue: "561589600",
      totalOrders: 1,
      series: [{ date: "2026-06-04", revenue: "561589600", orders: 1 }],
    },
  },
  "/api/admin/reports/products": {
    get: { products: [{ id: 1, title: "Gold ring", soldCount: 2, revenue: "566589600" }] },
  },
  "/api/admin/reports/customers": {
    get: { customers: [{ id: 1, phone: "09121234567", ordersCount: 1, totalSpent: "561589600", isVip: false }] },
  },
  "/api/admin/sms": { get: paginatedExamples.adminSms },
  "/api/admin/audit-logs": { get: paginatedExamples.adminAuditLogs },
  "/api/admin/settings": {
    get: { settings: { defaultShippingCost: "5000000", siteName: "pland" } },
    put: { success: true, message: "Settings updated", settings: { defaultShippingCost: "5000000" } },
  },
};

type OpenApiOperation = {
  responses?: Record<
    string,
    { content?: Record<string, { example?: unknown; schema?: unknown }> }
  >;
};

function setJsonExample(responses: OpenApiOperation["responses"], example: object) {
  if (!responses) return;
  for (const status of ["201", "200"]) {
    const block = responses[status]?.content?.["application/json"];
    if (block) block.example = example;
  }
}

/** Merge route-specific examples into operations (overrides preset defaults). */
function mergedExamples() {
  return { ...ROUTE_SUCCESS_EXAMPLES, ...ALIASED_EXAMPLES };
}

export function enrichOpenApiPaths<T extends Record<string, Record<string, OpenApiOperation>>>(
  paths: T,
  overrides: Record<string, Partial<Record<HttpMethod, object>>> = mergedExamples(),
): T {
  for (const [path, pathItem] of Object.entries(paths)) {
    const routeEx = overrides[path];
    if (!routeEx) continue;

    for (const method of Object.keys(pathItem) as HttpMethod[]) {
      const example = routeEx[method];
      if (example === undefined) continue;
      const operation = pathItem[method];
      if (operation) setJsonExample(operation.responses, example);
    }
  }
  return paths;
}
