"use client";

import CheckoutForm from "@/components/CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const PayPage = ({ params }: { params: { id: string } }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { id } = params;

  useEffect(() => {
    const makeRequest = async () => {
      if (!id) {
        setError("Invalid payment request.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/create-intent/${id}`, { method: "POST" });
        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(`/pay/${id}`)}`);
          return;
        }

        if (!res.ok) {
          throw new Error(data.message || "Could not start payment.");
        }

        if (!data.clientSecret) {
          throw new Error("Could not start payment.");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not start payment."
        );
      } finally {
        setIsLoading(false);
      }
    };

    makeRequest();
  }, [id, router]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <div>
      {error && (
        <p className="p-8 text-center text-red-600" role="alert">
          {error}
        </p>
      )}
      {isLoading && (
        <p className="p-8 text-center" role="status">
          Preparing secure payment...
        </p>
      )}
      {!error && !isLoading && !stripePromise && (
        <p className="p-8 text-center text-red-600" role="alert">
          Payment is unavailable right now. Please try again later.
        </p>
      )}
      {clientSecret && stripePromise && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
};

export default PayPage;
