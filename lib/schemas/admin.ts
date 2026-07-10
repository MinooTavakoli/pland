import { z } from "zod";
import {
  zId,
  zTrimmedString,
  zPositiveInt,
  zNonNegativeInt,
  zOptionalBool,
  zBigIntOptional,
  zDateOptional,
  zIdArray,
  zImages,
} from "@/lib/http/validation";
import { MSG } from "@/lib/http/messages";
import { idBodySchema } from "@/lib/schemas/common";

const productStatus = z.enum([
  "DRAFT",
  "AVAILABLE",
  "UNAVAILABLE",
  "RESERVED",
  "SOLD",
  "INACTIVE",
]);
const productGender = z.enum(["MALE", "FEMALE", "KIDS", "UNISEX"]);
const categoryGender = z
  .enum(["MALE", "FEMALE", "KIDS", "UNISEX"])
  .nullable()
  .optional();

export const adminProductCreateSchema = z.object({
  title: zTrimmedString,
  code: zTrimmedString,
  slug: z.string().optional(),
  gender: productGender.optional(),
  weight: z.coerce.number().optional().default(0),
  karat: z.coerce.number().int().optional().default(18),
  wage: z.coerce.number().optional().default(0),
  profit: z.coerce.number().optional().default(0),
  tax: z.coerce.number().optional().default(0),
  stock: zNonNegativeInt.optional().default(0),
  description: z.string().nullable().optional(),
  specs: z.unknown().optional(),
  images: zImages,
  status: productStatus.optional(),
  isGift: zOptionalBool,
  isNewCollection: zOptionalBool,
  isFeatured: zOptionalBool,
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
  canonical: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  categoryIds: zIdArray.optional().default([]),
  tagIds: zIdArray.optional().default([]),
  occasionIds: zIdArray.optional().default([]),
});

export const adminProductUpdateSchema = adminProductCreateSchema
  .partial()
  .extend({ id: zId });

const adminCategoryFieldsSchema = z.object({
  title: zTrimmedString.optional(),
  name: zTrimmedString.optional(),
  slug: z.string().optional(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  gender: categoryGender,
  image: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
  seoContent: z.string().nullable().optional(),
  order: zNonNegativeInt.optional(),
  isActive: zOptionalBool,
});

function categoryTitlePresent(d: { title?: string; name?: string }) {
  return Boolean((d.title ?? d.name ?? "").trim());
}

export const adminCategoryCreateSchema = adminCategoryFieldsSchema.refine(
  categoryTitlePresent,
  { message: MSG.category.nameRequired },
);

/** Zod 4: cannot call .partial() on schemas with .refine() — use base object for updates. */
export const adminCategoryUpdateSchema = adminCategoryFieldsSchema
  .partial()
  .extend({ id: zId })
  .refine(
    (d) =>
      d.title === undefined && d.name === undefined ? true : categoryTitlePresent(d),
    { message: MSG.category.nameRequired },
  );

export const adminTagCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
});

export const adminOccasionCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
  isActive: zOptionalBool,
});

export const adminOccasionUpdateSchema = adminOccasionCreateSchema
  .partial()
  .extend({ id: zId });

const giftBagType = z.enum(["NORMAL", "WOODEN", "VIP", "OCCASION"]);

export const adminGiftBagCreateSchema = z.object({
  type: giftBagType.optional(),
  title: zTrimmedString,
  image: z.string().nullable().optional(),
  price: zBigIntOptional,
  stock: zNonNegativeInt.optional().default(0),
  description: z.string().nullable().optional(),
  isActive: zOptionalBool,
});

export const adminGiftBagUpdateSchema = adminGiftBagCreateSchema
  .partial()
  .extend({ id: zId });

export const discountCodeCreateSchema = z.object({
  code: zTrimmedString,
  type: z.enum(["PERCENT", "FIXED"]).optional(),
  value: zPositiveInt,
  maxDiscount: zBigIntOptional,
  minOrder: zBigIntOptional,
  target: z.enum(["ALL", "VIP", "INACTIVE", "SPECIFIC"]).optional(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  startsAt: zDateOptional,
  expiresAt: zDateOptional,
  isActive: zOptionalBool,
  assignedUserIds: zIdArray.optional(),
});

export const discountCodeUpdateSchema = discountCodeCreateSchema
  .partial()
  .extend({ id: zId });

export const discountSendSchema = z.object({
  codeId: zId,
  target: z
    .enum(["ALL", "VIP", "INACTIVE", "SPECIFIC"])
    .optional()
    .default("ALL"),
  userIds: zIdArray.optional(),
  message: z.string().optional(),
});

export const adminOrderUpdateSchema = z.object({
  id: zId,
  status: z
    .enum([
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELED",
      "FAILED",
    ])
    .optional(),
  trackingNumber: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
  deliverySlotId: z.coerce.number().int().positive().optional().nullable(),
});

export const adminUserUpdateSchema = z.object({
  id: zId,
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  isVip: zOptionalBool,
  isActive: zOptionalBool,
});

export const adminReviewModerateSchema = z.object({
  id: zId,
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const adminReviewActionSchema = z.object({
  id: zId,
  action: z.enum(["approve", "reject"]),
});

export const deliverySlotCreateSchema = z.object({
  date: z.union([z.string(), z.date()]),
  fromHour: zTrimmedString,
  toHour: zTrimmedString,
  capacity: zPositiveInt.optional(),
  isActive: zOptionalBool,
});

export const deliverySlotUpdateSchema = deliverySlotCreateSchema
  .partial()
  .extend({ id: zId });

export const bannerCreateSchema = z.object({
  title: z.string().optional().nullable(),
  image: zTrimmedString,
  link: z.string().optional().nullable(),
  position: z.enum(["HOME_SLIDER", "AD_BANNER"]).optional(),
  order: zNonNegativeInt.optional(),
  isActive: zOptionalBool,
  startsAt: zDateOptional,
  endsAt: zDateOptional,
});

export const bannerUpdateSchema = bannerCreateSchema
  .partial()
  .extend({ id: zId });

export const faqCreateSchema = z.object({
  question: zTrimmedString,
  answer: zTrimmedString,
  category: z.string().optional().nullable(),
  order: zNonNegativeInt.optional(),
  isActive: zOptionalBool,
});

export const faqUpdateSchema = faqCreateSchema.partial().extend({ id: zId });

export const trustBadgeCreateSchema = z.object({
  title: zTrimmedString,
  image: zTrimmedString,
  link: z.string().optional().nullable(),
  order: zNonNegativeInt.optional(),
  isActive: zOptionalBool,
});

export const trustBadgeUpdateSchema = trustBadgeCreateSchema
  .partial()
  .extend({ id: zId });

export const campaignCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  startsAt: zDateOptional,
  endsAt: zDateOptional,
  isActive: zOptionalBool,
  productIds: zIdArray.optional(),
});

export const campaignUpdateSchema = campaignCreateSchema
  .partial()
  .extend({ id: zId });

export const blogPostCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: zTrimmedString,
  coverImage: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  tagIds: zIdArray.optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  publishedAt: zDateOptional,
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  articleSchema: z.unknown().optional(),
  faqSchema: z.unknown().optional(),
});

export const blogPostUpdateSchema = blogPostCreateSchema
  .extend({ content: zTrimmedString.optional() })
  .partial()
  .extend({ id: zId });

export const blogCategoryCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

export const blogCategoryUpdateSchema = blogCategoryCreateSchema
  .partial()
  .extend({ id: zId });

export const blogTagCreateSchema = z.object({
  title: zTrimmedString,
  slug: z.string().optional(),
});

export const staticPageSaveSchema = z.object({
  slug: zTrimmedString,
  title: zTrimmedString,
  content: zTrimmedString,
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  isActive: zOptionalBool,
});

export const adminOrderEditSchema = z.object({
  id: zId,
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string(), z.null()]).optional(),
  province: z.union([z.string(), z.null()]).optional(),
  city: z.string().optional(),
  postal: z.string().optional(),
  address: z.string().optional(),
  note: z.union([z.string(), z.null()]).optional(),
  shippingMethod: z.enum(["COURIER", "POST", "TIPAX"]).optional(),
  shippingCost: zBigIntOptional,
  deliveryDate: zDateOptional,
  deliveryTime: z.union([z.string(), z.null()]).optional(),
  giftBagPrice: zBigIntOptional,
  discountAmount: zBigIntOptional,
  total: zBigIntOptional,
  deliverySlotId: z.coerce.number().int().positive().optional().nullable(),
  giftBagId: z.coerce.number().int().positive().optional().nullable(),
});

export const sendDeliverySmsSchema = z.object({
  orderId: zId.optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  trackingCode: zTrimmedString.optional(),
});

export const salesReportQuerySchema = z.object({
  groupBy: z.enum(["day", "week", "month", "year"]).optional(),
  format: z.enum(["json", "csv"]).optional(),
  from: zDateOptional,
  to: zDateOptional,
});

export const customersReportQuerySchema = z.object({
  type: z.enum(["spent", "orders", "vip"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
  format: z.enum(["json", "csv"]).optional(),
});

export const productsReportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  actorId: z.coerce.number().int().positive().optional(),
});

export { idBodySchema };
