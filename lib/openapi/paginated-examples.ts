/**
 * Paginated list item shapes for OpenAPI examples (matches serializeBigInt + paginated()).
 */

import { productCardExample } from "./examples";

const pagination = (total = 1) => ({
  page: 1,
  pageSize: 20,
  total,
  totalPages: total > 0 ? 1 : 0,
});

export function pageOf<T>(item: T, total = 1) {
  return { items: [item], pagination: pagination(total) };
}

const orderItemLine = {
  id: 1,
  orderId: 1,
  productId: 1,
  title: "انگشتر طلا زنانه طرح قلب",
  weight: 3.2,
  price: "283294800",
  goldBase: "240000000",
  wageAmount: "26400000",
  profitAmount: "13320000",
  taxAmount: "3574800",
  quantity: 1,
};

const deliverySlotRef = {
  id: 1,
  date: "2026-06-10T00:00:00.000Z",
  fromHour: "09:00",
  toHour: "12:00",
  capacity: 20,
  isActive: true,
  createdAt: "2026-06-04T12:00:00.000Z",
};

const userOrderListItem = {
  id: 1,
  orderNumber: "PD-20260604-1234",
  userId: 1,
  status: "PAID",
  fullName: "علی رضایی",
  phone: "09121234567",
  email: null,
  province: "تهران",
  city: "تهران",
  postal: "1234567890",
  address: "خیابان ولیعصر",
  birthDate: null,
  note: null,
  shippingMethod: "COURIER",
  shippingCost: "5000000",
  deliverySlotId: 1,
  deliveryDate: "2026-06-10T00:00:00.000Z",
  deliveryTime: "09:00-12:00",
  giftBagId: null,
  giftBagPrice: "0",
  discountCodeId: null,
  discountAmount: "0",
  goldPriceSnapshot: "75000000",
  itemsTotal: "283294800",
  total: "288294800",
  trackingCode: "TRK123456",
  createdAt: "2026-06-04T12:27:54.881Z",
  updatedAt: "2026-06-04T12:30:00.000Z",
  items: [orderItemLine],
  tx: { method: "ONLINE", status: "PAID" },
  deliverySlot: deliverySlotRef,
  giftBag: null,
  invoice: { id: 1, invoiceNumber: "INV-20260604-0001" },
};

const adminOrderListItem = {
  ...userOrderListItem,
  user: {
    id: 1,
    phone: "09121234567",
    firstName: "علی",
    lastName: "رضایی",
  },
  tx: {
    id: 1,
    orderId: 1,
    method: "ONLINE",
    amount: "288294800",
    status: "PAID",
    bankNumber: null,
    refId: "MOCK-REF-001",
    receiptUrl: null,
    description: null,
    paidAt: "2026-06-04T12:30:00.000Z",
    createdAt: "2026-06-04T12:27:54.881Z",
    updatedAt: "2026-06-04T12:30:00.000Z",
  },
  giftBag: null,
};

const adminProductListItem = {
  id: 1,
  code: "PD-1001",
  slug: "product-1",
  title: "انگشتر طلا زنانه طرح قلب",
  gender: "FEMALE",
  weight: 3.2,
  karat: 18,
  wage: 11,
  profit: 5.5,
  tax: 9,
  stock: 4,
  priceCache: "283294800",
  description: null,
  specs: null,
  images: [] as string[],
  status: "AVAILABLE",
  isGift: false,
  isNewCollection: false,
  isFeatured: true,
  soldCount: 2,
  viewCount: 10,
  metaTitle: null,
  metaDesc: null,
  canonical: null,
  ogImage: null,
  createdAt: "2026-06-04T12:27:54.843Z",
  updatedAt: "2026-06-04T12:27:54.843Z",
  categories: [{ id: 2, title: "انگشتر زنانه", slug: "women-ring" }],
  tags: [{ id: 1, title: "پرفروش" }],
  occasions: [{ id: 1, title: "ولنتاین" }],
};

const blogPostPublicItem = {
  id: 1,
  title: "راهنمای خرید طلا",
  slug: "gold-buying-guide",
  excerpt: "نکات مهم هنگام خرید طلا",
  coverImage: "/storage/blog/cover.jpg",
  publishedAt: "2026-06-01T10:00:00.000Z",
  category: { id: 1, title: "راهنما", slug: "guides" },
};

const adminBlogPostItem = {
  id: 1,
  title: "راهنمای خرید طلا",
  slug: "gold-buying-guide",
  excerpt: "نکات مهم",
  content: "متن کامل مقاله...",
  coverImage: "/storage/blog/cover.jpg",
  status: "PUBLISHED",
  authorId: 1,
  categoryId: 1,
  metaTitle: null,
  metaDesc: null,
  articleSchema: null,
  faqSchema: null,
  publishedAt: "2026-06-01T10:00:00.000Z",
  createdAt: "2026-06-01T09:00:00.000Z",
  updatedAt: "2026-06-04T12:00:00.000Z",
  category: { id: 1, title: "راهنما" },
  tags: [{ id: 1, title: "طلا" }],
};

const userListItem = {
  id: 1,
  phone: "09121234567",
  firstName: "علی",
  lastName: "رضایی",
  email: null,
  role: "USER",
  isVip: false,
  isActive: true,
  totalSpent: "561589600",
  ordersCount: 1,
  createdAt: "2026-06-04T12:00:00.000Z",
  lastOrderAt: "2026-06-04T12:27:54.881Z",
};

const discountCodeItem = {
  id: 1,
  code: "SPRING10",
  type: "PERCENT",
  value: 10,
  maxDiscount: "50000000",
  minOrder: "0",
  target: "ALL",
  usageLimit: 100,
  perUserLimit: 1,
  usedCount: 2,
  startsAt: "2026-03-01T00:00:00.000Z",
  expiresAt: "2026-12-31T23:59:59.000Z",
  isActive: true,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-06-04T12:00:00.000Z",
  _count: { usages: 2, assignedUsers: 0 },
};

const reviewListItem = {
  id: 1,
  userId: 1,
  productId: 1,
  orderId: 1,
  rating: 5,
  comment: "کیفیت عالی",
  status: "APPROVED",
  createdAt: "2026-06-05T10:00:00.000Z",
  updatedAt: "2026-06-05T11:00:00.000Z",
  product: { id: 1, title: "انگشتر طلا زنانه طرح قلب" },
  user: { id: 1, firstName: "علی", lastName: "رضایی", phone: "09121234567" },
};

const transactionItem = {
  id: 1,
  orderId: 1,
  method: "MANUAL",
  amount: "288294800",
  status: "PENDING",
  bankNumber: null,
  refId: "1234567890",
  receiptUrl: "/storage/receipts/receipt.jpg",
  description: "فیش واریزی",
  paidAt: null,
  createdAt: "2026-06-04T12:27:54.881Z",
  updatedAt: "2026-06-04T12:27:54.881Z",
  order: {
    id: 1,
    orderNumber: "PD-20260604-1234",
    fullName: "علی رضایی",
    phone: "09121234567",
    status: "PENDING",
  },
};

const smsItem = {
  id: 1,
  phone: "09121234567",
  type: "OTP",
  message: "کد تأیید شما: 12345",
  status: "SENT",
  relatedId: null,
  error: null,
  createdAt: "2026-06-04T12:00:00.000Z",
  sentAt: "2026-06-04T12:00:01.000Z",
};

const auditLogItem = {
  id: 1,
  actorId: 1,
  actorRole: "ADMIN",
  action: "UPDATE",
  entity: "Order",
  entityId: "1",
  summary: "تغییر وضعیت سفارش",
  changes: { status: { from: "PENDING", to: "PAID" } },
  ip: "127.0.0.1",
  userAgent: "Mozilla/5.0",
  createdAt: "2026-06-04T12:30:00.000Z",
};

export const paginatedExamples = {
  userOrders: pageOf(userOrderListItem),
  adminOrders: pageOf(adminOrderListItem),
  adminProducts: pageOf(adminProductListItem),
  adminUsers: pageOf(userListItem),
  adminDiscountCodes: pageOf(discountCodeItem),
  adminBlogPosts: pageOf(adminBlogPostItem),
  publicBlogPosts: pageOf(blogPostPublicItem),
  adminReviews: pageOf(reviewListItem),
  adminTransactions: pageOf(transactionItem),
  adminSms: pageOf(smsItem),
  adminAuditLogs: pageOf(auditLogItem),
};

export const nestedItemsExamples = {
  orderDetailItems: [orderItemLine],
  campaignProducts: [productCardExample],
};
