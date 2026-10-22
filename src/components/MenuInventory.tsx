"use client";

import DeleteButton from "@/components/DeleteButton";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type MenuProduct = {
  id: string;
  title: string;
  img: string | null;
  price: number | string;
  catSlug: string;
  isFeatured: boolean;
  category: { title: string };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const MenuInventory = () => {
  const [products, setProducts] = useState<MenuProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products?manage=1", {
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Could not load menu items.";
          throw new Error(
            typeof message === "string" ? message : "Could not load menu items."
          );
        }
        if (
          !Array.isArray(data) ||
          !data.every(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              item.category &&
              typeof item.category.title === "string"
          )
        ) {
          throw new Error("The menu items response is invalid.");
        }
        setProducts(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load menu items."
        );
      }
    };

    void loadProducts();
    return () => controller.abort();
  }, []);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Menu items</h2>
          <p className="mt-1 text-sm text-stone-500">
            Current dishes and their catalog details
          </p>
        </div>
        {products && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        )}
      </header>

      {products === null && !error ? (
        <p className="p-6 text-sm text-stone-500" role="status">
          Loading menu items...
        </p>
      ) : error ? (
        <p className="p-6 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : products?.length === 0 ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <p className="font-semibold text-stone-800">Your menu is empty</p>
          <p className="mt-1 text-sm text-stone-500">
            Add your first dish using the form above.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {products?.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-orange-50">
                {product.img ? (
                  <Image
                    src={product.img}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-full place-items-center text-xl"
                  >
                    🍽️
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-stone-900">
                    {product.title}
                  </h3>
                  {product.isFeatured && (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {product.category.title} · {formatCurrency(Number(product.price))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/product/${product.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  View
                </Link>
                <DeleteButton
                  id={product.id}
                  onDeleted={() =>
                    setProducts((current) =>
                      current?.filter((item) => item.id !== product.id) ?? []
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MenuInventory;
