"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  cartItemId: number;
  title: string;
  images: string[];
  price: string;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart`);
      const data = await res.json();
      setItems(data?.items || []);
    } catch {
      alert("خطا در دریافت سبد خرید");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (cartItemId: number) => {
    if (!confirm("محصول حذف شود؟")) return;

    await fetch("/api/cart/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId }), // فقط cartItemId
    });

    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!items.length)
    return (
      <div className="p-6 text-center text-gray-500">سبد خرید خالی است</div>
    );

  const total = items.reduce(
    (acc, item) => acc + BigInt(item.price) * BigInt(item.quantity),
    BigInt(0)
  );

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">سبد خرید</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex gap-4 border p-4 rounded">
            <img
              src={item.images?.[0] || "/placeholder.png"}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <h2 className="font-bold">{item.title}</h2>
              <p>
                قیمت واحد: {Number(item.price).toLocaleString("fa-IR")} تومان
              </p>
              <p>تعداد: {item.quantity}</p>
            </div>
            <button
              onClick={() => handleRemove(item.cartItemId)}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="text-xl font-bold">
          مجموع: {Number(total).toLocaleString("fa-IR")} تومان
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="px-6 py-3 bg-green-600 text-white rounded"
        >
          ادامه ثبت سفارش
        </button>
      </div>
    </main>
  );
}
