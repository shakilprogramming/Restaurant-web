import { ProductType } from "@/types/types";
import { prisma } from "@/utils/connect";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import QuickAddButton from "./QuickAddButton";

const getData = async (): Promise<ProductType[] | null> => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      desc: product.desc,
      img: product.img ?? undefined,
      price: Number(product.price),
    }));
  } catch (error) {
    console.error("Failed to load featured products.", error);
    return null;

  }
};

const Featured = async () => {

  const featuredProducts = await getData();

  if (!featuredProducts) {
    return (
      <p className="w-full p-8 text-center text-red-500" role="status">
        Featured dishes are temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <p className="w-full p-8 text-center text-red-500" role="status">
        No featured dishes are available right now.
      </p>
    );
  }

  return (
    <section id="featured" aria-label="Featured dishes" className="w-full overflow-x-auto text-red-500">
      {/* WRAPPER */}
      <div className="w-max flex">
        {/* SINGLE ITEM */}
        {featuredProducts.map((item) => (
          <div
            key={item.id}
            className="w-screen h-[60vh] flex flex-col items-center justify-around p-4 hover:bg-fuchsia-50 transition-all duration-300 md:w-[50vw] xl:w-[33vw] xl:h-[90vh]"
          >
            {/* IMAGE CONTAINER */}
            {item.img && (
              <div className="relative flex-1 w-full hover:rotate-[60deg] transition-all duration-500">
                <Image src={item.img} alt={item.title} fill className="object-contain" />
              </div>
            )}
            {/* TEXT CONTAINER */}
            <div className=" flex-1 flex flex-col items-center justify-center text-center gap-4">
              <Link href={`/product/${item.id}`} className="text-xl font-bold uppercase xl:text-2xl 2xl:text-3xl">
                {item.title}
              </Link>
              <p className="p-4 2xl:p-8">{item.desc}</p>
              <span className="text-xl font-bold">${item.price}</span>
              <QuickAddButton
                product={{
                  id: item.id,
                  title: item.title,
                  img: item.img,
                  price: item.price,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Featured;
