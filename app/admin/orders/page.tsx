"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  status: string;
  total: string;
  phone: string;
  tx: {
    receiptUrl: string | null;
    status: string;
  } | null;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const confirm = async (orderId: number) => {
    await fetch("/api/admin/orders/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "confirm" }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "PAID", tx: { ...o.tx!, status: "PAID" } } : o))
    );
  };

  const reject = async (orderId: number) => {
    await fetch("/api/admin/orders/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "reject" }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, tx: { ...o.tx!, status: "REJECTED" } } : o))
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">سفارش‌ها</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg">
            <div className="flex justify-between">
              <div>سفارش #{order.id}</div>
              <div>وضعیت: {order.status}</div>
            </div>

            <div>مبلغ: {order.total}</div>
            <div>شماره: {order.phone}</div>

            <div className="mt-2">
              فیش:{" "}
              {order.tx?.receiptUrl ? (
                <a href={order.tx.receiptUrl} target="_blank" rel="noreferrer">
                  مشاهده فیش
                </a>
              ) : (
                "ندارد"
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => confirm(order.id)}>
                تایید
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => reject(order.id)}>
                رد
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
