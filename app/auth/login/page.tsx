"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const sendOtp = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (res.ok) setStep("otp");
    else alert((await res.json()).error);
  };

  const verifyOtp = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    setLoading(false);
    if (res.ok) router.push("/");
    else alert((await res.json()).error);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      {step === "phone" ? (
        <>
          <input
            type="text"
            placeholder="شماره تلفن"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
          />
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full p-2 bg-black text-white rounded"
          >
            ارسال OTP
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="رمز OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
          />
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full p-2 bg-black text-white rounded"
          >
            ورود
          </button>
        </>
      )}
    </div>
  );
}
