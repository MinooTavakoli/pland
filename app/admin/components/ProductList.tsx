/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const res = await fetch("/api/admin/products");
    setProducts(await res.json());
  };

  const remove = async (id: number) => {
    if (!confirm("حذف شود؟")) return;

    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ADMIN",
      },
      body: JSON.stringify({ id }),
    });

    load();
  };

  useEffect(() => {
    load();
  }, []);

  if (editing)
    return (
      <ProductForm
        editingProduct={editing}
        onSuccess={() => {
          setEditing(null);
          load();
        }}
      />
    );

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.id} className="border p-3 rounded">
          <div className="font-bold">{p.title}</div>
          <div className="text-sm">
            وزن: {p.weight} | اجرت: {p.wage} | سود: {p.profit}
          </div>

          <div className="flex gap-2 my-2">
            {p.images.map((img: string, i: number) => (
              <img key={i} src={img} className="w-12 h-12 object-cover" />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setEditing(p)} className="btn btn-sm">
              ویرایش
            </button>
            <button
              onClick={() => remove(p.id)}
              className="btn btn-sm btn-danger"
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
