"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh(); // رفرش برای پاک شدن state کاربر
  };

  return (
    <button
      onClick={logout}
      className="px-4 py-2 bg-red-500 text-white rounded"
    >
      خروج
    </button>
  );
}
