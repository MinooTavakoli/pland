"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Order = {
  id: number;
  status: string;
  total: string;
  tx: {
    bankNumber: string;
    receiptUrl: string | null;
    status: string;
  } | null;
};

export default function PaymentPage() {
  const params = useParams();
  const orderId = Number(params?.orderId);

  const [order, setOrder] = useState<Order | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/order/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data));
  }, [orderId]);

  const uploadReceipt = async () => {
    if (!receiptFile) {
      return alert("لطفاً عکس فیش را انتخاب کنید");
    }

    const formData = new FormData();
    formData.append("orderId", String(orderId));
    formData.append("receipt", receiptFile);

    const res = await fetch("/api/order/payment/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      alert("فیش ارسال شد");

      // اگر میخوای بعد آپلود، لینک فیش رو نمایش بدی
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              tx: {
                ...prev.tx!,
                receiptUrl: data.tx.receiptUrl,
                status: data.tx.status,
              },
            }
          : prev
      );
    } else {
      alert(data.error || "خطا در ارسال فیش");
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">پرداخت سفارش #{order.id}</h1>

      <p>مبلغ: {order.total}</p>
      <p>شماره کارت برای واریز: {order.tx?.bankNumber}</p>

      <div className="mt-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
        />

        <button
          className="bg-blue-500 text-red-500 px-4 py-2 mt-2"
          onClick={uploadReceipt}
        >
          ارسال فیش
        </button>
      </div>

      <div className="mt-4">
        وضعیت پرداخت: <b>{order.tx?.status}</b>
      </div>

      {order.tx?.receiptUrl && (
        <div className="mt-3">
          <a href={order.tx.receiptUrl} target="_blank" rel="noreferrer">
            مشاهده فیش ارسال شده
          </a>
        </div>
      )}
    </div>
  );
}
