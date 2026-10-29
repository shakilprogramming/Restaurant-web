"use client";

import DeleteButton from "@/components/DeleteButton";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type MenuProduct = {
  id: string;
  title: string;
  desc: string;
  img: string | null;
  price: number | string;
  catSlug: string;
  isFeatured: boolean;
  options: { title: string; additionalPrice: number }[];
  category: { title: string };
};

type CategoryOption = {
  slug: string;
  title: string;
};

type EditableProduct = {
  title: string;
  desc: string;
  price: string;
  catSlug: string;
  img: string;
  isFeatured: boolean;
  options: { title: string; additionalPrice: number }[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const MenuInventory = () => {
  const [products, setProducts] = useState<MenuProduct[] | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [editingProduct, setEditingProduct] = useState<MenuProduct | null>(null);
  const [form, setForm] = useState<EditableProduct | null>(null);
  const [optionTitle, setOptionTitle] = useState("");
  const [optionPrice, setOptionPrice] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadInventory = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          fetch("/api/products?manage=1", { signal: controller.signal }),
          fetch("/api/categories", { signal: controller.signal }),
        ]);
        const [data, categoryData]: [unknown, unknown] = await Promise.all([
          productResponse.json(),
          categoryResponse.json(),
        ]);
        if (!productResponse.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Could not load menu items.";
          throw new Error(typeof message === "string" ? message : "Could not load menu items.");
        }
        if (!categoryResponse.ok) {
          const message =
            categoryData && typeof categoryData === "object" && "message" in categoryData
              ? categoryData.message
              : "Could not load categories.";
          throw new Error(typeof message === "string" ? message : "Could not load categories.");
        }
        if (
          !Array.isArray(data) ||
          !data.every(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              typeof item.desc === "string" &&
              typeof item.catSlug === "string" &&
              Array.isArray(item.options) &&
              item.category &&
              typeof item.category.title === "string"
          )
        ) {
          throw new Error("The menu items response is invalid.");
        }
        if (
          !Array.isArray(categoryData) ||
          !categoryData.every(
            (category) =>
              category &&
              typeof category.slug === "string" &&
              typeof category.title === "string"
          )
        ) {
          throw new Error("The categories response is invalid.");
        }
        setProducts(data);
        setCategories(categoryData);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load menu items."
        );
      }
    };

    void loadInventory();
    return () => controller.abort();
  }, []);

  const startEditing = (product: MenuProduct) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      desc: product.desc,
      price: String(product.price),
      catSlug: product.catSlug,
      img: product.img ?? "",
      isFeatured: product.isFeatured,
      options: product.options.map((option) => ({
        title: option.title,
        additionalPrice: Number(option.additionalPrice),
      })),
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct || !form) return;

    const price = Number(form.price);
    if (!form.title.trim() || !form.desc.trim() || !form.catSlug || !Number.isFinite(price) || price <= 0) {
      setSaveError("Enter a title, description, valid price, and category.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          desc: form.desc.trim(),
          price,
          img: form.img.trim() || null,
          options: form.options,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "Could not update menu item.";
        throw new Error(typeof message === "string" ? message : "Could not update menu item.");
      }

      const selectedCategory = categories.find((item) => item.slug === form.catSlug);
      if (!selectedCategory) throw new Error("The selected category is unavailable.");
      setProducts((current) =>
        current?.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                title: form.title.trim(),
                desc: form.desc.trim(),
                price,
                catSlug: form.catSlug,
                img: form.img.trim() || null,
                isFeatured: form.isFeatured,
                options: form.options,
                category: { title: selectedCategory.title },
              }
            : item
        ) ?? null
      );
      setEditingProduct(null);
      setForm(null);
      setSaveSuccess("Menu item updated.");
    } catch (updateError) {
      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update menu item."
      );
    } finally {
      setIsSaving(false);
    }
  };

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

      {saveError && (
        <p className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700" role="alert">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-700" role="status">
          {saveSuccess}
        </p>
      )}

      {editingProduct && form && (
        <form onSubmit={(event) => void handleSave(event)} className="space-y-4 border-b border-stone-100 bg-stone-50/70 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-stone-900">Edit menu item</h3>
              <p className="mt-1 text-sm text-stone-500">{editingProduct.title}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setForm(null);
                setSaveError(null);
              }}
              className="min-h-9 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-600">
              Name
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(event) => setForm((current) => current && ({ ...current, title: event.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal text-stone-900 outline-none focus:border-orange-400"
              />
            </label>
            <label className="text-xs font-semibold text-stone-600">
              Price (USD)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((current) => current && ({ ...current, price: event.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal text-stone-900 outline-none focus:border-orange-400"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-stone-600">
            Description
            <textarea
              required
              maxLength={4000}
              rows={3}
              value={form.desc}
              onChange={(event) => setForm((current) => current && ({ ...current, desc: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-normal text-stone-900 outline-none focus:border-orange-400"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-600">
              Category
              <select
                required
                value={form.catSlug}
                onChange={(event) => setForm((current) => current && ({ ...current, catSlug: event.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal text-stone-900 outline-none focus:border-orange-400"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-stone-600">
              Image URL
              <input
                type="text"
                maxLength={2000}
                value={form.img}
                onChange={(event) => setForm((current) => current && ({ ...current, img: event.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal text-stone-900 outline-none focus:border-orange-400"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm((current) => current && ({ ...current, isFeatured: event.target.checked }))}
              className="h-4 w-4 accent-orange-600"
            />
            Feature this item on the homepage
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-stone-600">Options and variants</legend>
            {form.options.map((option, index) => (
              <div key={`${option.title}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
                <span className="min-w-0 flex-1 text-sm text-stone-800">{option.title}</span>
                <span className="text-xs text-stone-500">+{formatCurrency(option.additionalPrice)}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) =>
                      current
                        ? { ...current, options: current.options.filter((_, optionIndex) => optionIndex !== index) }
                        : current
                    )
                  }
                  className="min-h-8 rounded-md border border-rose-200 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
              <label className="sr-only" htmlFor="edit-option-title">New option name</label>
              <input
                id="edit-option-title"
                value={optionTitle}
                onChange={(event) => setOptionTitle(event.target.value)}
                placeholder="Option name"
                className="h-10 min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-orange-400"
              />
              <label className="sr-only" htmlFor="edit-option-price">Additional price</label>
              <input
                id="edit-option-price"
                type="number"
                min="0"
                step="0.01"
                value={optionPrice}
                onChange={(event) => setOptionPrice(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-orange-400"
              />
              <button
                type="button"
                onClick={() => {
                  const title = optionTitle.trim();
                  const additionalPrice = Number(optionPrice);
                  if (!title || !Number.isFinite(additionalPrice) || additionalPrice < 0) {
                    setSaveError("Enter a valid option name and additional price.");
                    return;
                  }
                  if (form.options.some((option) => option.title.toLowerCase() === title.toLowerCase())) {
                    setSaveError("Option names must be unique.");
                    return;
                  }
                  setForm((current) =>
                    current
                      ? { ...current, options: [...current.options, { title, additionalPrice }] }
                      : current
                  );
                  setOptionTitle("");
                  setOptionPrice("0");
                  setSaveError(null);
                }}
                className="min-h-10 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Add option
              </button>
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-10 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save menu item"}
          </button>
        </form>
      )}

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
            Add your first dish from menu management.
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
                <button
                  type="button"
                  onClick={() => startEditing(product)}
                  className="inline-flex min-h-10 items-center rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Edit
                </button>
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
