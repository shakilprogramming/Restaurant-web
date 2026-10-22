"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Inputs = {
  title: string;
  desc: string;
  price: number;
  catSlug: string;
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
  });

  const [option, setOption] = useState<Option>({
    title: "",
    additionalPrice: 0,
  });

  const [options, setOptions] = useState<Option[]>([]);
  const [file, setFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !session?.user.isAdmin)) {
      router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading" || (status === "authenticated" && !session?.user.isAdmin)) {
    return <p className="p-8 text-center" role="status">Loading...</p>;
  }
  if (status === "unauthenticated") return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "restaurant");

    const res = await fetch("https://api.cloudinary.com/v1_1/lamadev/image", {
      method: "POST",
      body: data,
    });

    const resData = await res.json();
    if (!res.ok || typeof resData.url !== "string") {
      throw new Error(resData.error?.message || "Image upload failed.");
    }
    return resData.url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputs.title.trim() || !inputs.desc.trim() || !inputs.catSlug.trim() || inputs.price <= 0) {
      toast.error("Enter a title, description, category, and a price above zero.");
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
    <main className="p-4 lg:px-20 xl:px-40 min-h-[calc(100svh-6rem)] md:min-h-[calc(100svh-9rem)] flex items-center justify-center text-red-500">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
        <h1 className="text-4xl mb-2 text-gray-300 font-bold">
          Add New Product
        </h1>
        <div className="w-full flex flex-col gap-2 ">
          <label
            className="text-sm cursor-pointer flex gap-4 items-center"
            htmlFor="file"
          >
            <Image src="/upload.png" alt="" width={30} height={20} />
            <span>Upload Image</span>
          </label>
          <input
            type="file"
            onChange={handleChangeImg}
            id="file"
            className="hidden"
          />
        </div>
        <div className="w-full flex flex-col gap-2 ">
          <label className="text-sm" htmlFor="product-title">Title</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            type="text"
            placeholder="Bella Napoli"
            name="title"
            id="product-title"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm" htmlFor="product-description">Description</label>
          <textarea
            rows={3}
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            placeholder="A timeless favorite with a twist, showcasing a thin crust topped with sweet tomatoes, fresh basil and creamy mozzarella."
            name="desc"
            id="product-description"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2 ">
          <label className="text-sm" htmlFor="product-price">Price</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
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
        <div className="w-full flex flex-col gap-2 ">
          <label className="text-sm" htmlFor="product-category">Category slug</label>
          <input
            className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
            type="text"
            placeholder="pizzas"
            name="catSlug"
            id="product-category"
            required
            onChange={handleChange}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="text-sm" htmlFor="option-title">Options</label>
          <div className="flex">
            <input
              className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
              type="text"
              placeholder="Title"
              name="title"
              id="option-title"
              value={option.title}
              aria-label="Option title"
              onChange={changeOption}
            />
            <input
              className="ring-1 ring-red-200 p-4 rounded-sm placeholder:text-red-200 outline-none"
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
              className="bg-gray-500 p-2 text-white"
              onClick={() => {
                if (!option.title.trim() || option.additionalPrice < 0) {
                  toast.error("Enter an option name and a valid additional price.");
                  return;
                }
                if (options.some((item) => item.title === option.title.trim())) {
                  toast.error("Option names must be unique.");
                  return;
                }
                setOptions((prev) => [...prev, { ...option, title: option.title.trim() }]);
                setOption({ title: "", additionalPrice: 0 });
              }}
            >
              Add Option
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.title}
                className="p-2 rounded-md cursor-pointer bg-gray-200 text-gray-700"
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
          className="bg-red-500 p-4 text-white w-48 rounded-md relative h-14 flex items-center justify-center"
        >
          {isSubmitting ? "Saving..." : "Submit"}
        </button>
      </form>
    </main>
  );
};

export default AddPage;