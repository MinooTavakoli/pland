"use client";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data?.categories ?? []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("نام دسته‌بندی را وارد کنید");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "خطا در افزودن دسته");
      return;
    }

    setName("");
    setParentId(null);
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchCategories();
  };

  // فقط دسته‌های سطح اول برای انتخاب والد
  const parentOptions = categories.filter((c) => !c.parentId);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">مدیریت دسته‌بندی‌ها</h1>

      {/* ---------- ADD CATEGORY ---------- */}
      <div className="mb-6 flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="نام دسته‌بندی"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={parentId ?? ""}
          onChange={(e) =>
            setParentId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">دسته اصلی</option>
          {parentOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-blue-600 text-black px-4 rounded hover:bg-blue-700"
        >
          افزودن
        </button>
      </div>

      {/* ---------- LIST ---------- */}
      <ul className="space-y-2">
        {parentOptions.map((cat) => (
          <li key={cat.id} className="border p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-bold">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-red-500 text-sm"
              >
                حذف
              </button>
            </div>

            <ul className="mt-2 ml-4 space-y-1">
              {categories
                .filter((c) => c.parentId === cat.id)
                .map((sub) => (
                  <li key={sub.id} className="flex justify-between text-sm">
                    <span>– {sub.name}</span>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-400"
                    >
                      حذف
                    </button>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
