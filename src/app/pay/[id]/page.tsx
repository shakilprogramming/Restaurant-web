"use client";

import CheckoutForm from "@/components/CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PayPage = ({ params }: { params: { id: string } }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = params;

  useEffect(() => {
    const makeRequest = async () => {
      try {
        const res = await fetch(
          `/create-intent/${id}`,
          {
            method: "POST",
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Could not start payment.");
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
  }, [id]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance:{
      theme:"stripe"
    }
  }

  return (
    <div>
      {error && <p className="p-8 text-center text-red-600" role="alert">{error}</p>}
      {isLoading && <p className="p-8 text-center" role="status">Preparing secure payment...</p>}
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
};

export default PayPage;
