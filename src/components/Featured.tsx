import { ProductType } from "@/types/types";
import { prisma } from "@/utils/connect";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import QuickAddButton from "./QuickAddButton";

export const dynamic = "force-dynamic";

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
      <p className="section-empty" role="status">
        Featured dishes are temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <p className="section-empty" role="status">
        No featured dishes are available right now.
      </p>
    );
  }

  return (
    <section id="featured" aria-label="Featured dishes" className="featured-section">
      <div className="section-heading"><p className="eyebrow">A few favorites</p><h2>Made to be remembered.</h2><p>Discover a little something delicious from our kitchen.</p></div>
      {/* WRAPPER */}
      <div className="featured-grid">
        {/* SINGLE ITEM */}
        {featuredProducts.map((item) => (
          <div
            key={item.id}
            className="featured-card"
          >
            {/* IMAGE CONTAINER */}
            {item.img && (
              <div className="featured-photo">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            {/* TEXT CONTAINER */}
            <div className="featured-info">
              <Link href={`/product/${item.id}`} className="featured-name">
                {item.title}
              </Link>
              <p>{item.desc}</p>
              <span className="featured-price">${item.price.toFixed(2)}</span>
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
