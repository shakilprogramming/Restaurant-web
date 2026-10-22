import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActionTypes, CartType } from "@/types/types";

const INITIAL_STATE: CartType = {
  products: [],
  totalItems: 0,
  totalPrice: 0,
};

export const useCartStore = create<CartType & ActionTypes>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      addToCart(item) {
        const products = get().products;
        const existingItem = products.find(
          (product) =>
            product.id === item.id && product.optionTitle === item.optionTitle
        );

        if (existingItem) {
          const updatedProducts = products.map((product) =>
            product.id === item.id && product.optionTitle === item.optionTitle
              ? {
                  ...product,
                  quantity: product.quantity + item.quantity,
                  price: product.price + item.price,
                }
              : product
          );

          set((state) => ({
            products: updatedProducts,
            totalItems: state.totalItems + item.quantity,
            totalPrice: state.totalPrice + item.price,
          }));
          return;
        }

        set((state) => ({
          products: [...state.products, item],
          totalItems: state.totalItems + item.quantity,
          totalPrice: state.totalPrice + item.price,
        }));
      },
      removeFromCart(item) {
        set((state) => ({
          products: state.products.filter(
            (product) =>
              product.id !== item.id ||
              product.optionTitle !== item.optionTitle
          ),
          totalItems: state.totalItems - item.quantity,
          totalPrice: state.totalPrice - item.price,
        }));
      },
      clearCart() {
        set(INITIAL_STATE);
      },
    }),
    { name: "cart", skipHydration: true }
  )
);
