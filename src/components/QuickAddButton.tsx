"use client";

import { CartItemType } from "@/types/types";
import { useCartStore } from "@/utils/store";
import React from "react";
import { toast } from "react-toastify";

type QuickAddProduct = Pick<CartItemType, "id" | "title" | "img" | "price">;

const QuickAddButton = ({ product }: { product: QuickAddProduct }) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart({ ...product, quantity: 1 });
    toast.success(`${product.title} added to your cart.`);
  };

  return (
    <button
      type="button"
      className="bg-red-500 text-white p-2 rounded-md"
      onClick={handleAdd}
    >
      Add to Cart
    </button>
  );
};

export default QuickAddButton;
