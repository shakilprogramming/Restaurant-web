       "use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { useCartStore } from "@/utils/store";

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get("payment_intent");
  const clearCart = useCartStore((state) => state.clearCart);
  const [confirmation, setConfirmation] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!payment_intent) {
      setConfirmation("error");
      return;
    }
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const makeRequest = async () => {
      try {
        const response = await fetch(`/confirm/${payment_intent}`, {
          method: "PUT",
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Could not confirm the order.");
        }
        if (cancelled) return;
        clearCart();
        setConfirmation("success");
        redirectTimer = setTimeout(() => {
          router.push("/orders");
        }, 5000);
      } catch (err) {
        console.error("Failed to confirm the order.", err);
        if (!cancelled) setConfirmation("error");
      }
    };

    makeRequest();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [payment_intent, router, clearCart]);

  return (
    <>
      <div className="min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-15rem)] flex items-center justify-center text-center text-2xl text-green-700">
        {confirmation === "loading" && (
          <p role="status">Confirming your payment...</p>
        )}
        {confirmation === "success" && (
          <div>
            <p className="max-w-[600px]">
              Payment confirmed. You will be redirected to your orders shortly.
            </p>
            <ConfettiExplosion className="absolute m-auto" />
          </div>
        )}
        {confirmation === "error" && (
          <p role="alert">
            We could not confirm this payment. Please contact the restaurant
            before trying to pay again.
          </p>
        )}
      </div>
    </>
  );
};

export default SuccessPage;