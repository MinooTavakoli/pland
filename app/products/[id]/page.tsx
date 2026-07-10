/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProductPageClient() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // userId باید عددی باشه
  const userId = 1;

  // const userId =
  //   typeof window !== "undefined"
  //     ? Number(localStorage.getItem("userId"))
  //     : null;

  // ---------- GET PRODUCT ----------
  useEffect(() => {
    if (!id) return;

    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));
  }, [id]);

  // ---------- GET CART ----------
  const fetchCartQuantity = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/cart`);
      const data = await res.json();
      const item = data.items.find((i: any) => i.productId === Number(id));
      setQuantity(item ? item.quantity : 0);
    } catch (err) {
      console.error("FETCH CART ERROR 👉", err);
    }
  };

  useEffect(() => {
    fetchCartQuantity();
  }, [id, userId]);

  // ---------- ADD ----------
  const addToCart = async () => {
    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: product.id, quantity: 1 }),
      });

      if (res.ok) {
        // بعد از افزودن، دوباره سبد رو بگیر
        await fetchCartQuantity();
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- DECREASE ----------
  const decreaseFromCart = async () => {
    if (quantity <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/cart/decrease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId: product.id }),
      });

      if (res.ok) {
        await fetchCartQuantity();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* IMAGE */}
        <div className="bg-gray-100 h-96 flex items-center justify-center rounded">
          {product?.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="max-h-full"
            />
          ) : (
            <span className="text-gray-400">بدون تصویر</span>
          )}
        </div>

        {/* INFO */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

          <p className="text-green-600 text-xl mb-4">
            {Number(product.price).toLocaleString("fa-IR")} تومان
          </p>

          {product.description && (
            <p className="text-gray-700 leading-7 mb-6">
              {product.description}
            </p>
          )}

          {/* ---------- CART CONTROLS ---------- */}
          {quantity === 0 ? (
            <button
              onClick={addToCart}
              disabled={loading}
              className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800"
            >
              افزودن به سبد خرید
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={decreaseFromCart}
                disabled={loading}
                className="w-10 h-10 border rounded text-xl"
              >
                −
              </button>

              <span className="text-lg font-bold">{quantity}</span>

              <button
                onClick={addToCart}
                disabled={loading}
                className="w-10 h-10 border rounded text-xl"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
