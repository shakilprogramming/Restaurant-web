"use client";
import { useCartStore } from "@/utils/store";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const CartPage = () => {
  const { products, totalItems, totalPrice, removeFromCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const handleCheckout = async () => {
    if (products.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (!session) {
      router.push("/login");
      return;
    }

    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: totalPrice,
          products,
          status: "Not Paid!",
          userEmail: session.user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not create your order.");
      }
      router.push(`/pay/${data.id}`);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Could not start checkout. Please try again."
      );
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-6rem)] md:min-h-[calc(100svh-9rem)] flex flex-col text-red-500 lg:flex-row">
      {/* PRODUCTS CONTAINER */}
      <div className="min-h-64 p-4 flex flex-col justify-center overflow-y-auto lg:min-h-full lg:w-2/3 2xl:w-1/2 lg:px-20 xl:px-40">
        {/* SINGLE ITEM */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center" role="status">
            <p>Your cart is empty.</p>
            <Link className="underline" href="/menu">Browse the menu</Link>
          </div>
        ) : products.map((item) => (
          <div className="flex items-center justify-between mb-4" key={`${item.id}-${item.optionTitle ?? "default"}`}>
            {item.img && (
              <Image src={item.img} alt={item.title} width={100} height={100} />
            )}
            <div className="">
              <h1 className="uppercase text-xl font-bold">
                {item.title} x{item.quantity}
              </h1>
              <span>{item.optionTitle}</span>
            </div>
            <h2 className="font-bold">${item.price}</h2>
            <button
              type="button"
              aria-label={`Remove ${item.title} from cart`}
              className="cursor-pointer"
              onClick={() => removeFromCart(item)}
            >
              X
            </button>
          </div>
        ))}
      </div>
      {/* PAYMENT CONTAINER */}
      <div className="min-h-64 p-4 bg-fuchsia-50 flex flex-col gap-4 justify-center lg:min-h-full lg:w-1/3 2xl:w-1/2 lg:px-20 xl:px-40 2xl:text-xl 2xl:gap-6">
        <div className="flex justify-between">
          <span className="">Subtotal ({totalItems} items)</span>
          <span className="">${totalPrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="">Service Cost</span>
          <span className="">$0.00</span>
        </div>
        <div className="flex justify-between">
          <span className="">Delivery Cost</span>
          <span className="text-green-500">FREE!</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between">
          <span className="">TOTAL</span>
          <span className="font-bold">${totalPrice}</span>
        </div>
        <button
          className="bg-red-500 text-white p-3 rounded-md w-1/2 self-end disabled:opacity-60"
          onClick={handleCheckout}
          disabled={isCheckingOut || products.length === 0}
        >
          {isCheckingOut ? "Starting checkout..." : "CHECKOUT"}
        </button>
        {checkoutError && (
          <p className="text-red-700 text-right" role="alert">
            {checkoutError}
          </p>
        )}
      </div>
    </main>
  );
};

export default CartPage;