import { prisma } from "@/utils/connect";
import { toProductType } from "@/utils/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

const CategoryPage = async ({ params }: { params: { category: string } }) => {
  const category = await prisma.category.findUnique({
    where: { slug: params.category },
  });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { catSlug: params.category },
  });

  return (
    <main className="min-h-[calc(100svh-6rem)] bg-orange-50/50 px-4 py-10 md:px-10 lg:px-20 xl:px-40">
      <header className="mb-8 border-b border-orange-200 pb-6">
        <Link href="/menu" className="text-sm font-semibold text-red-500 hover:underline">← All menu categories</Link>
        <h1 className="mt-4 text-4xl font-bold text-stone-900">{category.title}</h1>
        <p className="mt-2 max-w-2xl text-stone-600">{category.desc}</p>
      </header>
      {products.length === 0 ? (
        <p role="status" className="rounded-xl bg-white p-8 text-center text-stone-600">Dishes in this category are coming soon.</p>
      ) : (
        <section aria-label={`${category.title} dishes`} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((record) => {
            const item = toProductType(record);
            return (
              <Link
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
                href={`/product/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-orange-100">
                  {item.img ? (
                    <Image src={item.img} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">🍽️</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-stone-900">{item.title}</h2>
                    <span className="shrink-0 font-bold text-red-600">${item.price.toFixed(2)}</span>
                  </div>
                  {item.desc && <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{item.desc}</p>}
                  <span className="mt-4 inline-block text-sm font-semibold text-red-500">View dish <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default CategoryPage;
