"use client";

import { useEffect, useState } from "react";

type Category = {
  id: number;
  title: string;
  children: {
    id: number;
    title: string;
  }[];
};

type ProductCategory = {
  id: number;
  title: string;
  parent?: {
    id: number;
    title: string;
  } | null;
};

type Product = {
  id: number;
  title: string;
  images: string[];
  price: string;
  status: string;
  soldCount?: number;
  categories: ProductCategory[];
};


export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState("ALL");
  const [parentCategory, setParentCategory] = useState("");
  const [childCategory, setChildCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");

  // ---------- دریافت دسته‌بندی ----------
  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data?.categories ?? []);
  };

  // ---------- دریافت محصولات ----------
  const fetchProducts = async () => {
    const params = new URLSearchParams();

    if (status !== "ALL") params.set("status", status);
    if (childCategory) params.set("categoryId", childCategory);
    else if (parentCategory) params.set("parentCategoryId", parentCategory);

    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);

    params.set("page", page.toString());
    params.set("limit", limit.toString());

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();

    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [status, parentCategory, childCategory, minPrice, maxPrice, sort, page]);

  const selectedParent = categories.find(
    (c) => c.id.toString() === parentCategory
  );

  return (
    <div className="p-4">
      {/* ---------- FILTERS ---------- */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* وضعیت */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ALL">تمام محصولات</option>
          <option value="AVAILABLE">موجود</option>
          <option value="SOLD">ناموجود</option>
        </select>

        {/* دسته اصلی */}
        <select
          value={parentCategory}
          onChange={(e) => {
            setParentCategory(e.target.value);
            setChildCategory(""); // ریست زیر دسته
          }}
          className="border p-2 rounded"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.title}
            </option>
          ))}
        </select>

        {/* زیر دسته */}
        <select
          value={childCategory}
          onChange={(e) => setChildCategory(e.target.value)}
          className="border p-2 rounded"
          disabled={!parentCategory}
        >
          <option value="">همه زیر‌دسته‌ها</option>
          {selectedParent?.children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.title}
            </option>
          ))}
        </select>

        {/* قیمت */}
        <input
          type="number"
          placeholder="حداقل قیمت"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border p-2 rounded w-32"
        />

        <input
          type="number"
          placeholder="حداکثر قیمت"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border p-2 rounded w-32"
        />

        {/* مرتب سازی */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">مرتب‌سازی</option>
          <option value="priceAsc">ارزان‌ترین</option>
          <option value="priceDesc">گران‌ترین</option>
          <option value="newest">جدیدترین</option>
          <option value="bestseller">پرفروش‌ترین</option>
        </select>
      </div>

      {/* ---------- PRODUCTS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border p-4 rounded shadow">
            <h2 className="font-bold mb-2">{p.title}</h2>

            {p.images?.[0] ? (
              <img
                src={p.images[0]}
                alt={p.title}
                className="w-full h-40 object-cover mb-2"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center mb-2">
                بدون تصویر
              </div>
            )}

            <p>قیمت: {Number(p.price).toLocaleString("fa-IR")} تومان</p>
            <p>اجرت: {p.priceDetail.wage}</p>
            <p>مالیات: {p.priceDetail.tax}</p>

            {p.isGift && <p className="text-green-600">🎁 هدیه</p>}
            {p.isNewCollection && (
              <p className="text-blue-600">✨ کالکشن جدید</p>
            )}
            
          </div>
        ))}
      </div>

      {/* ---------- PAGINATION (بعداً rc-pagination) ---------- */}
      {/* آماده است */}
    </div>
  );
}
