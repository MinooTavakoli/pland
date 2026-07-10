/** Response body examples aligned with actual API route handlers */

export const productCardExample = {
  id: 1,
  code: "PD-1001",
  slug: "product-1",
  title: "انگشتر طلا زنانه طرح قلب",
  gender: "FEMALE",
  weight: 3.2,
  karat: 18,
  images: [] as string[],
  status: "AVAILABLE",
  stock: 4,
  inStock: true,
  isGift: false,
  isNewCollection: false,
  isFeatured: true,
  soldCount: 2,
  createdAt: "2026-06-04T12:27:54.843Z",
  price: "283294800",
  priceDetail: {
    base: "240000000",
    wage: "26400000",
    profit: "13320000",
    tax: "3574800",
    total: "283294800",
  },
  categories: [
    {
      id: 2,
      title: "انگشتر زنانه",
      slug: "women-ring",
      parentId: 1,
    },
  ],
};

export const productDetailExample = {
  ...productCardExample,
  wage: 11,
  profit: 5.5,
  tax: 9,
  description: "انگشتر طلا ۱۸ عیار با نگین طرح قلب",
  specs: { size: "52", material: "gold" },
  tags: [{ id: 1, title: "پرفروش", slug: "bestseller" }],
  occasions: [{ id: 1, title: "ولنتاین", slug: "valentine" }],
  seo: {
    metaTitle: "انگشتر طلا زنانه طرح قلب",
    metaDesc: null,
    canonical: null,
    ogImage: null,
    schema: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "انگشتر طلا زنانه طرح قلب",
      sku: "PD-1001",
    },
  },
};

const categoryChild = {
  id: 2,
  title: "انگشتر زنانه",
  slug: "women-ring",
  parentId: 1,
  gender: "FEMALE",
  image: null,
  children: [] as object[],
};

export const responseExamples = {
  paginatedProducts: {
    items: [productCardExample],
    pagination: { page: 1, pageSize: 20, total: 10, totalPages: 1 },
  },

  productDetail: {
    product: productDetailExample,
    similar: [productCardExample],
    related: [],
    reviews: [
      {
        id: 1,
        rating: 5,
        comment: "کیفیت عالی",
        createdAt: "2026-06-01T10:00:00.000Z",
        author: "علی رضایی",
      },
    ],
    rating: { average: 5, count: 1 },
  },

  categoryTree: {
    categories: [
      {
        id: 1,
        title: "زنانه",
        slug: "women",
        parentId: null,
        gender: "FEMALE",
        image: null,
        children: [categoryChild],
      },
    ],
  },

  tags: {
    tags: [{ id: 1, title: "پرفروش", slug: "bestseller" }],
  },

  occasions: {
    occasions: [{ id: 1, title: "ولنتاین", slug: "valentine" }],
  },

  giftBags: {
    bags: [
      {
        id: 1,
        type: "BOX",
        title: "بگ هدیه کلاسیک",
        image: null,
        price: "150000",
        description: null,
      },
    ],
  },

  banners: {
    banners: [
      {
        id: 1,
        title: "اسلایدر اصلی",
        image: "/storage/banners/slide-1.jpg",
        link: "/products",
        position: "HOME_SLIDER",
        order: 0,
      },
    ],
  },

  faqs: {
    faqs: [{ id: 1, question: "چگونه سفارش دهم؟", answer: "...", order: 0 }],
  },

  trustBadges: {
    badges: [{ id: 1, title: "نماد اعتماد", image: "/storage/badges/trust.png", link: null }],
  },

  campaigns: {
    campaigns: [
      {
        id: 1,
        title: "جشنواره بهار",
        slug: "spring-sale",
        banner: null,
        description: null,
        startsAt: "2026-03-01T00:00:00.000Z",
        endsAt: "2026-06-30T23:59:59.000Z",
      },
    ],
  },

  blogCategories: {
    categories: [
      { id: 1, title: "اخبار", slug: "news", _count: { posts: 5 } },
    ],
  },

  deliverySlots: [
    {
      id: 1,
      date: "2026-06-10T00:00:00.000Z",
      fromHour: "09:00",
      toHour: "12:00",
      capacity: 20,
      isActive: true,
    },
  ],

  wishlist: {
    items: [productCardExample],
  },
} as const;
