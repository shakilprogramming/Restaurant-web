"use client";

import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    if (!clientSecret) return;

    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent, error }) => {
        if (error) {
          setMessage(error.message || "Could not verify the payment status.");
          return;
        }
        switch (paymentIntent?.status) {
          case "succeeded":
            setMessage("Payment succeeded.");
            break;
          case "processing":
            setMessage("Your payment is processing.");
            break;
          case "requires_payment_method":
            setMessage("Your payment was not successful. Please try again.");
            break;
          default:
            setMessage("We could not verify the payment status.");
        }
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not verify the payment status."
        );
      });
  }, [stripe]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "Your payment could not be completed.");
      } else if (paymentIntent?.status === "succeeded") {
        window.location.assign(
          `${window.location.origin}/success?payment_intent=${paymentIntent.id}`
        );
      } else if (paymentIntent?.status === "processing") {
        setMessage("Your payment is processing. Please wait for confirmation.");
      } else {
        setMessage("Payment was not completed. Please try again.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Your payment could not be completed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      id="payment-form"
      onSubmit={handleSubmit}
      className="min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-15rem)] p-4 lg:px-20 xl:px-40 flex flex-col gap-8"
    >
      <AddressForm />
      <LinkAuthenticationElement id="link-authentication-element" />
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="bg-red-500 text-white p-4 rounded-md w-28 disabled:opacity-60"
      >
        {isLoading ? "Processing..." : "Pay now"}
      </button>
      {message && (
        <div id="payment-message" role="status">
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
