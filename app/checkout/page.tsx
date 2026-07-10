"use client";

import { useEffect, useState } from "react";

type CartItem = {
  cartItemId: number;
  productId: number;
  title: string;
  images: string[];
  weight: number;
  wage: number;
  profit: number;
  price: string;
  quantity: number;
  totalPrice: string;
};

type DeliverySlot = {
  id: number;
  date: string;
  fromHour: string;
  toHour: string;
  capacity: number;
  isActive: boolean;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState("0");
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [note, setNote] = useState("");

  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [deliverySlotId, setDeliverySlotId] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
    fetchDeliverySlots();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    const res = await fetch(`/api/cart`);
    const data = await res.json();
    setItems(data.items || []);
    setCartTotal(data.cartTotal || "0");
    setLoading(false);
  };

  const fetchDeliverySlots = async () => {
    const res = await fetch("/api/delivery-slots");
    const data = await res.json();
    setDeliverySlots(data);
  };

  const handleCheckout = async () => {
    if (!fullName || !phone || !address || !postal || !deliverySlotId) {
      alert("لطفا تمام فیلدها را پر کنید");
      return;
    }

    const res = await fetch("/api/order/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        address,
        postal,
        note,
        deliverySlotId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "خطا در ثبت سفارش");
      return;
    }

    alert("سفارش ثبت شد. کد پیگیری: " + data.id);
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">صفحه پرداخت</h1>

      {/* فرم اطلاعات کاربر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="نام و نام خانوادگی"
          className="border p-3 rounded"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره تلفن"
          className="border p-3 rounded"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل (اختیاری)"
          className="border p-3 rounded"
        />
        <input
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          placeholder="کد پستی"
          className="border p-3 rounded"
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="آدرس"
          className="border p-3 rounded col-span-2"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="توضیحات (اختیاری)"
          className="border p-3 rounded col-span-2"
        />
      </div>

      {/* انتخاب زمان ارسال */}
      <div className="mt-6">
        <h2 className="font-bold mb-2">زمان ارسال</h2>
        <select
          className="border p-3 rounded w-full"
          value={deliverySlotId || ""}
          onChange={(e) => setDeliverySlotId(Number(e.target.value))}
        >
          <option value="">انتخاب زمان ارسال</option>
          {deliverySlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {new Date(slot.date).toLocaleDateString("fa-IR")} |{" "}
              {slot.fromHour} - {slot.toHour}
            </option>
          ))}
        </select>
      </div>

      {/* سبد خرید */}
      <div className="mt-6 border rounded p-4">
        <h2 className="font-bold mb-2">سبد خرید</h2>
        {items.map((item) => (
          <div key={item.cartItemId} className="flex justify-between mb-2">
            <div>
              {item.title} x {item.quantity}
            </div>
            <div>{Number(item.totalPrice).toLocaleString("fa-IR")} تومان</div>
          </div>
        ))}
        <div className="mt-4 font-bold">
          جمع کل: {Number(cartTotal).toLocaleString("fa-IR")} تومان
        </div>
      </div>

      {/* دکمه پرداخت */}
      <button
        onClick={handleCheckout}
        className="mt-6 w-full py-3 rounded text-white bg-black"
      >
        پرداخت
      </button>
    </main>
  );
}
