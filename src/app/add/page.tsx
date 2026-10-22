"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import MenuInventory from "@/components/MenuInventory";

type CategoryOption = {
  slug: string;
  title: string;
};

type Inputs = {
  title: string;
  desc: string;
  price: number;
  catSlug: string;
  isFeatured: boolean;
};

type Option = {
  title: string;
  additionalPrice: number;
};

const AddPage = () => {
  const { data: session, status } = useSession();
  const [inputs, setInputs] = useState<Inputs>({
    title: "",
    desc: "",
    price: 0,
    catSlug: "",
    isFeatured: false,
  });

  const [option, setOption] = useState<Option>({
    title: "",
    additionalPrice: 0,
  });

  const [options, setOptions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(
    null
  );
  const [file, setFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && !session?.user.isAdmin)
    ) {
      router.replace("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user.isAdmin) return;

    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories", {
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Could not load categories.";
          throw new Error(
            typeof message === "string" ? message : "Could not load categories."
          );
        }
        if (
          !Array.isArray(data) ||
          !data.every(
            (category) =>
              category &&
              typeof category.slug === "string" &&
              typeof category.title === "string"
          )
        ) {
          throw new Error("The categories response is invalid.");
        }
        setCategories(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCategoryLoadError(
          error instanceof Error ? error.message : "Could not load categories."
        );
        setCategories([]);
      }
    };

    loadCategories();
    return () => controller.abort();
  }, [status, session?.user.isAdmin]);

  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user.isAdmin)
  ) {
    return (
      <p className="p-8 text-center" role="status">
        Loading...
      </p>
    );
  }
  if (status === "unauthenticated") return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setInputs((prev) => {
      return {
        ...prev,
        [e.target.name]:
          e.target.name === "price" ? Number(e.target.value) : e.target.value,
      };
    });
  };

  const changeOption = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOption((prev) => {
      return {
        ...prev,
        [e.target.name]:
          e.target.name === "additionalPrice"
            ? Number(e.target.value)
            : e.target.value,
      };
    });
  };

  const handleChangeImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0]);
  };

  const upload = async () => {
    if (!file) throw new Error("Choose an image before submitting.");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Image upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env."
      );
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const resData = await res.json();
    if (!res.ok || typeof resData.secure_url !== "string") {
      throw new Error(resData.error?.message || "Image upload failed.");
    }
    return resData.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !inputs.title.trim() ||
      !inputs.desc.trim() ||
      !inputs.catSlug.trim() ||
      inputs.price <= 0
    ) {
      toast.error(
        "Enter a title, description, category, and a price above zero."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const url = await upload();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          img: url,
          ...inputs,
          options,
          isFeatured: inputs.isFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not create the product.");
      }
      router.push(`/product/${data.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create the product.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-78px)] bg-stone-50 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Menu management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Add a menu item
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Add a dish, set its category and pricing, and choose whether to feature it.
          </p>
        </header>
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
        >
        <div className="w-full">
          <label
            className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-400 hover:bg-orange-50/60"
            htmlFor="file"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6 text-orange-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0L7 9m5-5 5 5M4 16v4h16v-4"
              />
            </svg>
            <span>{file ? "Change product image" : "Upload product image"}</span>
            {file && (
              <span className="max-w-full truncate text-xs font-normal text-stone-500">
                {file.name}
              </span>
            )}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleChangeImg}
            id="file"
            className="sr-only"
          />
        </div>
        <label className="flex w-full items-start gap-3 rounded-xl border border-stone-200 p-4 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={inputs.isFeatured}
            onChange={(event) =>
              setInputs((prev) => ({ ...prev, isFeatured: event.target.checked }))
            }
            className="mt-0.5 h-4 w-4 accent-orange-600"
          />
          <span>
            <span className="block font-semibold text-stone-900">Feature on the homepage</span>
            <span className="mt-1 block text-xs text-stone-500">
              Show this dish in the storefront featured section.
            </span>
          </span>
        </label>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm font-semibold text-stone-700" htmlFor="product-title">
            Title
          </label>
          <input
            className="min-h-12 rounded-lg border border-stone-200 px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            type="text"
            placeholder="Bella Napoli"
            name="title"
            id="product-title"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm font-semibold text-stone-700" htmlFor="product-description">
            Description
          </label>
          <textarea
            rows={3}
            className="rounded-lg border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            placeholder="A timeless favorite with a twist, showcasing a thin crust topped with sweet tomatoes, fresh basil and creamy mozzarella."
            name="desc"
            id="product-description"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm font-semibold text-stone-700" htmlFor="product-price">
            Price
          </label>
          <input
            className="min-h-12 rounded-lg border border-stone-200 px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            type="number"
            placeholder="29"
            name="price"
            id="product-price"
            min="0.01"
            step="0.01"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm font-semibold text-stone-700" htmlFor="product-category">
            Category
          </label>
          <select
            className="min-h-12 rounded-lg border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            name="catSlug"
            id="product-category"
            value={inputs.catSlug}
            required
            disabled={!categories?.length}
            onChange={handleChange}
          >
            <option value="">
              {categories === null ? "Loading categories..." : "Select a category"}
            </option>
            {categories?.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </select>
          {categoryLoadError && (
            <p className="text-sm text-red-700" role="alert">
              {categoryLoadError}
            </p>
          )}
          {categories?.length === 0 && !categoryLoadError && (
            <p className="text-sm text-red-700" role="status">
              No categories are available. Add a category before creating a product.
            </p>
          )}
        </div>
        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="text-sm font-semibold text-stone-700" htmlFor="option-title">
              Options and variants
            </label>
            <p className="mt-1 text-xs text-stone-500">
              Add optional sizes or variants and their additional price.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="min-h-12 min-w-0 rounded-lg border border-stone-200 px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              type="text"
              placeholder="Title"
              name="title"
              id="option-title"
              value={option.title}
              aria-label="Option title"
              onChange={changeOption}
            />
            <input
              className="min-h-12 min-w-0 rounded-lg border border-stone-200 px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              type="number"
              placeholder="Additional Price"
              name="additionalPrice"
              value={option.additionalPrice}
              aria-label="Additional price"
              min="0"
              step="0.01"
              onChange={changeOption}
            />
            <button
              type="button"
              className="min-h-12 rounded-lg bg-stone-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
              onClick={() => {
                if (!option.title.trim() || option.additionalPrice < 0) {
                  toast.error(
                    "Enter an option name and a valid additional price."
                  );
                  return;
                }
                if (
                  options.some((item) => item.title === option.title.trim())
                ) {
                  toast.error("Option names must be unique.");
                  return;
                }
                setOptions((prev) => [
                  ...prev,
                  { ...option, title: option.title.trim() },
                ]);
                setOption({ title: "", additionalPrice: 0 });
              }}
            >
              Add Option
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.title}
                className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900 transition-colors hover:bg-rose-50 hover:text-rose-800"
                aria-label={`Remove ${opt.title} option`}
                onClick={() =>
                  setOptions((prev) =>
                    prev.filter((item) => item.title !== opt.title)
                  )
                }
              >
                <span>{opt.title}</span>
                <span className="text-xs"> (+ ${opt.additionalPrice})</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-48"
        >
          {isSubmitting ? "Saving..." : "Submit"}
        </button>
        </form>
        <MenuInventory />
      </div>
    </main>
  );
};

export default AddPage;
