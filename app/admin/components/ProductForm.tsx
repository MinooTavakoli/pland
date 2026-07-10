/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

interface ProductFormProps {
  onSuccess: () => void;
  editingProduct?: any;
}

export default function ProductForm({
  onSuccess,
  editingProduct,
}: ProductFormProps) {
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(0);
  const [wage, setWage] = useState(0);
  const [profit, setProfit] = useState(0);
  const [status, setStatus] = useState("AVAILABLE");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setWeight(editingProduct.weight);
      setWage(editingProduct.wage);
      setProfit(editingProduct.profit);
      setStatus(editingProduct.status);
      setImages(editingProduct.images || []);
    }
  }, [editingProduct]);

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = editingProduct ? "PUT" : "POST";

    await fetch("/api/admin/products", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "ADMIN",
      },
      body: JSON.stringify({
        id: editingProduct?.id,
        title,
        weight,
        wage,
        profit,
        images,
        status,
      }),
    });

    setLoading(false);
    onSuccess();
  };

  return (
    <form
      className="bg-white p-4 rounded shadow space-y-3"
      onSubmit={handleSubmit}
    >
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان"
      />
      <input
        className="input"
        type="number"
        value={weight}
        onChange={(e) => setWeight(+e.target.value)}
        placeholder="وزن"
      />
      <input
        className="input"
        type="number"
        value={wage}
        onChange={(e) => setWage(+e.target.value)}
        placeholder="اجرت"
      />
      <input
        className="input"
        type="number"
        value={profit}
        onChange={(e) => setProfit(+e.target.value)}
        placeholder="سود"
      />

      <input
        type="file"
        onChange={async (e) => {
          if (!e.target.files?.[0]) return;
          const url = await uploadImage(e.target.files[0]);
          setImages((prev) => [...prev, url]);
        }}
      />

      <div className="flex gap-2">
        {images.map((img, i) => (
          <img key={i} src={img} className="w-16 h-16 object-cover rounded" />
        ))}
      </div>

      <select
        className="input"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="AVAILABLE">موجود</option>
        <option value="RESERVED">رزرو</option>
        <option value="SOLD">فروخته</option>
        <option value="INACTIVE">غیرفعال</option>
      </select>

      <button disabled={loading} className="btn btn-primary w-full">
        {editingProduct ? "ویرایش محصول" : "افزودن محصول"}
      </button>
    </form>
  );
}
