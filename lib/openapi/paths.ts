import {
  op,
  jsonBody,
  pathParam,
  queryParam,
  schemaRef,
  SITE,
  ADMIN,
} from "./components";
import { responseExamples } from "./examples";

export const openApiPaths = {
  // ─── Auth ─────────────────────────────────────────────────────────────
  "/api/auth/send-otp": {
    post: op("post", {
      tag: "Auth",
      summary: "ارسال کد OTP",
      preset: "publicAuth",
      successExample: { success: true, message: "کد تأیید ارسال شد" },
      requestBody: jsonBody(
        { type: "object", required: ["phone"], properties: { phone: { type: "string", example: "09121234567" } } },
        { phone: "09121234567" },
      ),
    }),
  },
  "/api/auth/verify-otp": {
    post: op("post", {
      tag: "Auth",
      summary: "تأیید OTP و ورود",
      description: "کوکی site-auth ست می‌شود",
      preset: "publicAuth",
      successExample: {
        success: true,
        message: "ورود موفق",
        user: { id: 1, phone: "09121234567", role: "USER" },
      },
      requestBody: jsonBody(
        { type: "object", required: ["otp"], properties: { otp: { type: "string", example: "12345" } } },
        { otp: "12345" },
      ),
    }),
  },
  "/api/auth/login": {
    post: op("post", {
      tag: "Auth",
      summary: "ورود با OTP هش‌شده (legacy)",
      requestBody: jsonBody({
        type: "object",
        properties: { phone: { type: "string" }, otp: { type: "string" } },
      }),
    }),
  },
  "/api/auth/logout": {
    post: op("post", { tag: "Auth", summary: "خروج", security: SITE }),
  },
  "/api/auth/me": {
    get: op("get", { tag: "Auth", summary: "پروفایل جاری", security: SITE }),
    patch: op("patch", {
      tag: "Auth",
      summary: "به‌روزرسانی پروفایل",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          birthDate: { type: "string", format: "date" },
        },
      }),
    }),
  },

  // ─── Products & catalog ─────────────────────────────────────────────
  "/api/products": {
    get: op("get", {
      tag: "Products",
      summary: "List and search products",
      description:
        "Returns paginated product cards with live price from current gold rate. Requires gold price to be set (503 otherwise).",
      errors: ["503"],
      successDescription: "Paginated product list",
      successSchema: schemaRef("PaginatedProductList"),
      successExample: responseExamples.paginatedProducts,
      parameters: [
        queryParam("q", "Search in title, code, or category title"),
        queryParam("sort", "newest | oldest | priceAsc | priceDesc | bestseller"),
        queryParam("categoryId", "Filter by category id (includes children)", { type: "integer" }),
        queryParam("category", "Filter by category slug"),
        queryParam("gender", "MALE | FEMALE | KIDS | UNISEX"),
        queryParam("occasion", "Filter by occasion slug"),
        queryParam("occasionId", "Filter by occasion id", { type: "integer" }),
        queryParam("tagId", "Filter by tag id", { type: "integer" }),
        queryParam("isNew", "New collection only", { type: "boolean" }),
        queryParam("isFeatured", "Featured only", { type: "boolean" }),
        queryParam("isGift", "Gift products only", { type: "boolean" }),
        queryParam("minPrice", "Min price (Rials)", { type: "integer" }),
        queryParam("maxPrice", "Max price (Rials)", { type: "integer" }),
        queryParam("minWeight", "Min weight (grams)", { type: "number" }),
        queryParam("maxWeight", "Max weight (grams)", { type: "number" }),
        queryParam("wageTier", "Wage tier: low | mid | high"),
        queryParam("inStock", "In stock only", { type: "boolean" }),
        queryParam("page", "Page number", { type: "integer" }),
        queryParam("pageSize", "Items per page (max 100)", { type: "integer" }),
      ],
    }),
  },
  "/api/products/{id}": {
    get: op("get", {
      tag: "Products",
      summary: "Product detail (id or slug)",
      description:
        "Full product detail with similar/related products and approved reviews. Increments view count.",
      preset: "publicReadOne",
      errors: ["503"],
      parameters: [pathParam("id", "Product id or slug")],
      successDescription: "Product detail payload",
      successSchema: schemaRef("ProductDetailResponse"),
      successExample: responseExamples.productDetail,
    }),
  },
  "/api/categories": {
    get: op("get", {
      tag: "Catalog",
      summary: "Category tree",
      successDescription: "Nested category tree",
      successSchema: schemaRef("CategoryTreeResponse"),
      successExample: responseExamples.categoryTree,
    }),
  },
  "/api/tags": {
    get: op("get", {
      tag: "Catalog",
      summary: "Tags list",
      successExample: responseExamples.tags,
    }),
  },
  "/api/occasions": {
    get: op("get", {
      tag: "Catalog",
      summary: "Occasions list",
      successExample: responseExamples.occasions,
    }),
  },
  "/api/gift-bags": {
    get: op("get", {
      tag: "Catalog",
      summary: "Active gift bags",
      successExample: responseExamples.giftBags,
    }),
  },
  "/api/gold-price": {
    get: op("get", {
      tag: "GoldPrice",
      summary: "آخرین قیمت طلا",
      errors: ["503"],
      successExample: { price: 75000000, updatedAt: "2026-06-04T12:00:00.000Z" },
    }),
    post: op("post", {
      tag: "GoldPrice",
      summary: "ثبت قیمت طلا (ادمین)",
      security: ADMIN,
      requestBody: jsonBody({
        type: "object",
        required: ["price"],
        properties: { price: { type: "integer", example: 75000000 } },
      }),
    }),
  },

  // ─── Cart & wishlist ────────────────────────────────────────────────
  "/api/cart": { get: op("get", { tag: "Cart", summary: "مشاهده سبد", security: SITE }) },
  "/api/cart/add": {
    post: op("post", {
      tag: "Cart",
      summary: "افزودن به سبد",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        required: ["productId"],
        properties: { productId: { type: "integer" }, quantity: { type: "integer", default: 1 } },
      }),
    }),
  },
  "/api/cart/update": {
    post: op("post", {
      tag: "Cart",
      summary: "تغییر تعداد آیتم",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        properties: { cartItemId: { type: "integer" }, quantity: { type: "integer" } },
      }),
    }),
  },
  "/api/cart/increase": {
    post: op("post", {
      tag: "Cart",
      summary: "افزایش تعداد",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { productId: { type: "integer" } } }),
    }),
  },
  "/api/cart/decrease": {
    post: op("post", {
      tag: "Cart",
      summary: "کاهش تعداد",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { productId: { type: "integer" } } }),
    }),
  },
  "/api/cart/remove": {
    delete: op("delete", {
      tag: "Cart",
      summary: "حذف آیتم",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { cartItemId: { type: "integer" } } }),
    }),
  },
  "/api/cart/clear": { post: op("post", { tag: "Cart", summary: "خالی کردن سبد", security: SITE }) },
  "/api/cart/bag": {
    post: op("post", {
      tag: "Cart",
      summary: "انتخاب بگ",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { bagId: { type: "integer" } } }),
    }),
    delete: op("delete", { tag: "Cart", summary: "حذف بگ از سبد", security: SITE }),
  },
  "/api/cart/discount": {
    post: op("post", {
      tag: "Cart",
      summary: "اعمال کد تخفیف",
      security: SITE,
      errors: ["422"],
      requestBody: jsonBody({ type: "object", properties: { code: { type: "string" } } }),
    }),
    delete: op("delete", { tag: "Cart", summary: "حذف کد تخفیف", security: SITE }),
  },
  "/api/wishlist": {
    get: op("get", {
      tag: "Wishlist",
      summary: "Wishlist",
      security: SITE,
      successExample: responseExamples.wishlist,
    }),
    post: op("post", {
      tag: "Wishlist",
      summary: "افزودن",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { productId: { type: "integer" } } }),
    }),
    delete: op("delete", {
      tag: "Wishlist",
      summary: "حذف",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { productId: { type: "integer" } } }),
    }),
  },
  "/api/wishlist/move-to-cart": {
    post: op("post", {
      tag: "Wishlist",
      summary: "انتقال به سبد",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { productId: { type: "integer" } } }),
    }),
  },

  // ─── Orders & payment ───────────────────────────────────────────────
  "/api/order/checkout": {
    post: op("post", {
      tag: "Orders",
      summary: "ثبت سفارش (checkout)",
      preset: "checkout",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        required: ["fullName", "phone", "city", "postal", "address"],
        properties: {
          fullName: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          province: { type: "string" },
          city: { type: "string" },
          postal: { type: "string" },
          address: { type: "string" },
          deliverySlotId: { type: "integer" },
          shippingMethod: { type: "string", enum: ["COURIER", "POST", "TIPAX"] },
          paymentMethod: { type: "string", enum: ["ONLINE", "MANUAL"] },
        },
      }),
    }),
  },
  "/api/order/confirm": {
    post: op("post", {
      tag: "Orders",
      summary: "پرداخت آزمایشی آنلاین",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        properties: { orderId: { type: "integer" }, success: { type: "boolean", default: true } },
      }),
    }),
  },
  "/api/order/payment/upload": {
    post: op("post", {
      tag: "Orders",
      summary: "آپلود فیش پرداخت دستی",
      security: SITE,
      description: "multipart/form-data: orderId, receipt, trackingNumber?, description?",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                orderId: { type: "integer" },
                receipt: { type: "string", format: "binary" },
                trackingNumber: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
    }),
  },
  "/api/order/{orderId}": {
    get: op("get", {
      tag: "Orders",
      summary: "جزئیات سفارش",
      security: SITE,
      errors: ["404"],
      parameters: [pathParam("orderId", "شناسه سفارش")],
    }),
  },
  "/api/orders": {
    get: op("get", {
      tag: "Orders",
      summary: "تاریخچه سفارشات",
      security: SITE,
      parameters: [
        queryParam("group", "current|completed|canceled"),
        queryParam("page", "صفحه", { type: "integer" }),
      ],
    }),
  },
  "/api/invoice": {
    get: op("get", {
      tag: "Orders",
      summary: "فاکتور (JSON یا HTML)",
      security: SITE,
      parameters: [
        queryParam("orderId", "شناسه سفارش", { type: "integer" }),
        queryParam("format", "json|html"),
      ],
    }),
  },
  "/api/reviews": {
    get: op("get", { tag: "Orders", summary: "نظرات من", security: SITE }),
    post: op("post", {
      tag: "Orders",
      summary: "ثبت نظر پس از تحویل",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        properties: {
          productId: { type: "integer" },
          orderId: { type: "integer" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string" },
        },
      }),
    }),
  },

  // ─── Account ────────────────────────────────────────────────────────
  "/api/dashboard": { get: op("get", { tag: "Account", summary: "داشبورد مشتری", security: SITE }) },
  "/api/addresses": {
    get: op("get", { tag: "Account", summary: "لیست آدرس‌ها", security: SITE }),
    post: op("post", {
      tag: "Account",
      summary: "ثبت آدرس",
      preset: "siteCreate",
      security: SITE,
      requestBody: jsonBody({
        type: "object",
        properties: {
          city: { type: "string" },
          postal: { type: "string" },
          address: { type: "string" },
          isDefault: { type: "boolean" },
        },
      }),
    }),
    put: op("put", {
      tag: "Account",
      summary: "ویرایش آدرس",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { id: { type: "integer" } } }),
    }),
    delete: op("delete", {
      tag: "Account",
      summary: "حذف آدرس",
      security: SITE,
      requestBody: jsonBody({ type: "object", properties: { id: { type: "integer" } } }),
    }),
  },

  // ─── CMS (public) ───────────────────────────────────────────────────
  "/api/banners": {
    get: op("get", {
      tag: "CMS",
      summary: "Banners",
      parameters: [queryParam("position", "HOME_SLIDER|AD_BANNER")],
      successExample: responseExamples.banners,
    }),
  },
  "/api/faqs": {
    get: op("get", {
      tag: "CMS",
      summary: "FAQs",
      successExample: responseExamples.faqs,
    }),
  },
  "/api/trust-badges": {
    get: op("get", {
      tag: "CMS",
      summary: "Trust badges",
      successExample: responseExamples.trustBadges,
    }),
  },
  "/api/blog/posts": {
    get: op("get", {
      tag: "CMS",
      summary: "لیست مقالات",
      parameters: [queryParam("q", "جستجو"), queryParam("category", "اسلاگ دسته")],
    }),
  },
  "/api/blog/posts/{slug}": {
    get: op("get", {
      tag: "CMS",
      summary: "مقاله",
      preset: "publicReadOne",
      parameters: [pathParam("slug", "اسلاگ مقاله")],
    }),
  },
  "/api/blog/categories": {
    get: op("get", {
      tag: "CMS",
      summary: "Blog categories",
      successExample: responseExamples.blogCategories,
    }),
  },
  "/api/pages/{slug}": {
    get: op("get", {
      tag: "CMS",
      summary: "صفحه ثابت (about|contact|terms|privacy)",
      preset: "publicReadOne",
      parameters: [pathParam("slug", "اسلاگ صفحه")],
    }),
  },
  "/api/campaigns": {
    get: op("get", {
      tag: "Campaigns",
      summary: "Active campaigns",
      successExample: responseExamples.campaigns,
    }),
  },
  "/api/campaigns/{slug}": {
    get: op("get", {
      tag: "Campaigns",
      summary: "جزئیات کمپین",
      preset: "publicReadOne",
      parameters: [pathParam("slug", "اسلاگ کمپین")],
    }),
  },
  "/api/delivery-slots": {
    get: op("get", {
      tag: "Delivery",
      summary: "Delivery slots",
      successExample: responseExamples.deliverySlots,
    }),
  },
  "/api/delivery-slots/active": {
    get: op("get", {
      tag: "Delivery",
      summary: "Active delivery slots",
      successExample: responseExamples.deliverySlots,
    }),
  },

  // ─── Admin ──────────────────────────────────────────────────────────
  "/api/admin/login": {
    post: op("post", {
      tag: "Admin",
      summary: "ورود ادمین",
      preset: "publicAuth",
      description: "کوکی admin-auth ست می‌شود",
      requestBody: jsonBody({
        type: "object",
        properties: { phone: { type: "string" }, secret: { type: "string" } },
      }),
      successExample: {
        success: true,
        message: "ورود ادمین موفق",
        user: { id: 1, phone: "09120000000", role: "ADMIN" },
      },
    }),
  },
  "/api/admin/logout": { post: op("post", { tag: "Admin", summary: "خروج ادمین", security: ADMIN }) },
  "/api/admin/dashboard": { get: op("get", { tag: "Admin", summary: "KPI داشبورد", security: ADMIN }) },
  "/api/admin/products": {
    get: op("get", { tag: "Admin", summary: "لیست محصولات", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد محصول", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش محصول", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف محصول", security: ADMIN }),
  },
  "/api/admin/categories": {
    get: op("get", { tag: "Admin", summary: "دسته‌ها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد دسته", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش دسته", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف دسته", security: ADMIN }),
  },
  "/api/admin/tags": {
    get: op("get", { tag: "Admin", summary: "تگ‌ها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد تگ", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف تگ", security: ADMIN }),
  },
  "/api/admin/occasions": {
    get: op("get", { tag: "Admin", summary: "مناسبت‌ها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/gift-bags": {
    get: op("get", { tag: "Admin", summary: "بگ‌ها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد بگ", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش بگ", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف بگ", security: ADMIN }),
  },
  "/api/admin/orders": {
    get: op("get", { tag: "Admin", summary: "لیست سفارشات", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش سفارش", security: ADMIN }),
  },
  "/api/admin/orders/status": {
    post: op("post", { tag: "Admin", summary: "تغییر وضعیت سفارش", security: ADMIN }),
  },
  "/api/admin/orders/payment/confirm": {
    post: op("post", {
      tag: "Admin",
      summary: "تأیید/رد پرداخت دستی",
      security: ADMIN,
      requestBody: jsonBody({
        type: "object",
        properties: {
          orderId: { type: "integer" },
          action: { type: "string", enum: ["confirm", "reject"] },
        },
      }),
    }),
  },
  "/api/admin/orders/list": {
    get: op("get", { tag: "Admin", summary: "لیست سفارشات (alias)", security: ADMIN }),
  },
  "/api/admin/users": {
    get: op("get", { tag: "Admin", summary: "لیست کاربران", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش کاربر/VIP", security: ADMIN }),
  },
  "/api/admin/users/{id}": {
    get: op("get", {
      tag: "Admin",
      summary: "پروفایل مشتری",
      security: ADMIN,
      errors: ["404"],
      parameters: [pathParam("id", "شناسه کاربر")],
    }),
  },
  "/api/admin/delivery-slots": {
    get: op("get", { tag: "Admin", summary: "بازه ارسال", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد بازه", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش بازه", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف بازه", security: ADMIN }),
  },
  "/api/admin/discount-codes": {
    get: op("get", { tag: "Admin", summary: "کدهای تخفیف", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد کد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش کد", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "غیرفعال‌سازی", security: ADMIN }),
  },
  "/api/admin/discount-codes/send": {
    post: op("post", { tag: "Admin", summary: "ارسال کد به کاربران", security: ADMIN }),
  },
  "/api/admin/campaigns": {
    get: op("get", { tag: "Admin", summary: "کمپین‌ها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد کمپین", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/banners": {
    get: op("get", { tag: "Admin", summary: "بنرها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/faqs": {
    get: op("get", { tag: "Admin", summary: "FAQ", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/trust-badges": {
    get: op("get", { tag: "Admin", summary: "نمادها", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/blog/posts": {
    get: op("get", { tag: "Admin", summary: "مقالات", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد مقاله", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/blog/categories": {
    get: op("get", { tag: "Admin", summary: "دسته بلاگ", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "ویرایش", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/blog/tags": {
    get: op("get", { tag: "Admin", summary: "تگ بلاگ", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ایجاد", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/pages": {
    get: op("get", { tag: "Admin", summary: "صفحات ثابت", security: ADMIN }),
    post: op("post", { tag: "Admin", summary: "ذخیره صفحه", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف", security: ADMIN }),
  },
  "/api/admin/upload": {
    post: op("post", {
      tag: "Admin",
      summary: "آپلود فایل",
      security: ADMIN,
      description: "multipart: file/files, folder=products|banners|...",
    }),
  },
  "/api/admin/reviews": {
    get: op("get", { tag: "Admin", summary: "نظرات", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "تأیید/رد نظر", security: ADMIN }),
    delete: op("delete", { tag: "Admin", summary: "حذف نظر", security: ADMIN }),
  },
  "/api/admin/transactions": { get: op("get", { tag: "Admin", summary: "تراکنش‌ها", security: ADMIN }) },
  "/api/admin/send-delivery-sms": {
    post: op("post", { tag: "Admin", summary: "ارسال SMS رهگیری", security: ADMIN }),
  },
  "/api/admin/reports/sales": {
    get: op("get", {
      tag: "Admin",
      summary: "گزارش فروش",
      security: ADMIN,
      parameters: [
        queryParam("groupBy", "day|week|month|year"),
        queryParam("format", "json|csv"),
      ],
    }),
  },
  "/api/admin/reports/products": {
    get: op("get", {
      tag: "Admin",
      summary: "گزارش محصولات",
      security: ADMIN,
      parameters: [queryParam("format", "json|csv")],
    }),
  },
  "/api/admin/reports/customers": {
    get: op("get", {
      tag: "Admin",
      summary: "گزارش مشتریان",
      security: ADMIN,
      parameters: [queryParam("type", "spent|orders|vip")],
    }),
  },
  "/api/admin/sms": { get: op("get", { tag: "Admin", summary: "لاگ پیامک", security: ADMIN }) },
  "/api/admin/audit-logs": { get: op("get", { tag: "Admin", summary: "لاگ audit", security: ADMIN }) },
  "/api/admin/settings": {
    get: op("get", { tag: "Admin", summary: "تنظیمات", security: ADMIN }),
    put: op("put", { tag: "Admin", summary: "به‌روزرسانی تنظیمات", security: ADMIN }),
  },
};
