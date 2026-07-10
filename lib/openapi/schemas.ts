/**
 * OpenAPI component schemas aligned with lib/catalog/product.ts serializers and route responses.
 */

const priceDetail = {
  type: "object",
  description: "Price breakdown (all amounts in Rials, stringified BigInt)",
  properties: {
    base: { type: "string", description: "Gold base value" },
    wage: { type: "string", description: "Wage amount" },
    profit: { type: "string", description: "Profit amount" },
    tax: { type: "string", description: "Tax amount" },
    total: { type: "string", description: "Final price" },
  },
  required: ["base", "wage", "profit", "tax", "total"],
};

const categoryRef = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    slug: { type: "string" },
    parentId: { type: "integer", nullable: true },
  },
};

const tagRef = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    slug: { type: "string" },
  },
};

const productCard = {
  type: "object",
  description: "Product summary for listings (serializeProductCard)",
  properties: {
    id: { type: "integer" },
    code: { type: "string", example: "PD-1001" },
    slug: { type: "string", example: "product-1" },
    title: { type: "string" },
    gender: { type: "string", enum: ["MALE", "FEMALE", "KIDS", "UNISEX"] },
    weight: { type: "number", description: "Weight in grams" },
    karat: { type: "integer", example: 18 },
    images: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["AVAILABLE", "DRAFT", "INACTIVE"] },
    stock: { type: "integer" },
    inStock: { type: "boolean" },
    isGift: { type: "boolean" },
    isNewCollection: { type: "boolean" },
    isFeatured: { type: "boolean" },
    soldCount: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
    price: { type: "string", description: "Total price in Rials" },
    priceDetail: priceDetail,
    categories: { type: "array", items: categoryRef },
  },
};

export const openApiSchemas = {
  PriceDetail: priceDetail,
  CategoryRef: categoryRef,
  TagRef: tagRef,
  ProductCard: productCard,

  ProductSeo: {
    type: "object",
    properties: {
      metaTitle: { type: "string" },
      metaDesc: { type: "string", nullable: true },
      canonical: { type: "string", nullable: true },
      ogImage: { type: "string", nullable: true },
      schema: { type: "object", description: "JSON-LD Product schema" },
    },
  },

  ProductDetail: {
    allOf: [
      { $ref: "#/components/schemas/ProductCard" },
      {
        type: "object",
        properties: {
          wage: { type: "number", description: "Wage percentage" },
          profit: { type: "number", description: "Profit percentage" },
          tax: { type: "number", description: "Tax percentage" },
          description: { type: "string", nullable: true },
          specs: { type: "object", nullable: true, additionalProperties: true },
          tags: { type: "array", items: { $ref: "#/components/schemas/TagRef" } },
          occasions: { type: "array", items: { $ref: "#/components/schemas/TagRef" } },
          seo: { $ref: "#/components/schemas/ProductSeo" },
        },
      },
    ],
  },

  Pagination: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      pageSize: { type: "integer", example: 20 },
      total: { type: "integer", example: 10 },
      totalPages: { type: "integer", example: 1 },
    },
  },

  PaginatedProductList: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/ProductCard" },
      },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  },

  ProductReview: {
    type: "object",
    properties: {
      id: { type: "integer" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      author: { type: "string" },
    },
  },

  ProductRatingSummary: {
    type: "object",
    properties: {
      average: { type: "number" },
      count: { type: "integer" },
    },
  },

  ProductDetailResponse: {
    type: "object",
    properties: {
      product: { $ref: "#/components/schemas/ProductDetail" },
      similar: {
        type: "array",
        items: { $ref: "#/components/schemas/ProductCard" },
      },
      related: {
        type: "array",
        items: { $ref: "#/components/schemas/ProductCard" },
      },
      reviews: {
        type: "array",
        items: { $ref: "#/components/schemas/ProductReview" },
      },
      rating: { $ref: "#/components/schemas/ProductRatingSummary" },
    },
  },

  CategoryNode: {
    allOf: [
      {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          slug: { type: "string" },
          parentId: { type: "integer", nullable: true },
          gender: { type: "string", enum: ["MALE", "FEMALE", "KIDS", "UNISEX"] },
          image: { type: "string", nullable: true },
        },
      },
      {
        type: "object",
        properties: {
          children: {
            type: "array",
            items: { $ref: "#/components/schemas/CategoryNode" },
          },
        },
      },
    ],
  },

  CategoryTreeResponse: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: { $ref: "#/components/schemas/CategoryNode" },
      },
    },
  },
};

/** $ref helper for operation response schemas */
export function schemaRef(name: keyof typeof openApiSchemas | string) {
  return { $ref: `#/components/schemas/${name}` };
}
