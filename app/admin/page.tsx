"use client";

import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [refresh, setRefresh] = useState(0);
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">پنل ادمین - مدیریت محصولات</h1>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          خروج
        </button>
      </div>

      <ProductForm onAdded={() => setRefresh((r) => r + 1)} />
      <hr className="my-4" />
      <ProductList key={refresh} />
    </div>
  );
}
