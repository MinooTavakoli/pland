"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, secret }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  return (
    <form
      className="max-w-sm mx-auto mt-24 bg-white p-6 rounded shadow space-y-3"
      onSubmit={submit}
    >
      <h1 className="text-xl font-bold">ورود ادمین</h1>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <input
        className="input"
        placeholder="شماره موبایل"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        type="password"
        className="input"
        placeholder="کد ورود ادمین"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />

      <button className="btn btn-primary w-full">ورود</button>
    </form>
  );
}
