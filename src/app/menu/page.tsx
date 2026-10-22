import { MenuType } from "@/types/types";
import { prisma } from "@/utils/connect";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

const MenuPage = async () => {
  let menu: MenuType;
  try {
    menu = await prisma.category.findMany();
  } catch (error) {
    console.error("Failed to load menu categories from the database.", error);
    return (
      <main className="min-h-[calc(100svh-6rem)] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          The menu is temporarily unavailable.
        </h1>
        <p role="alert">
          We couldn&apos;t connect to the menu database. Please try again in a
          moment.
        </p>
        <Link
          href="/menu"
          className="rounded-md bg-red-500 px-4 py-2 text-white"
        >
          Try again
        </Link>
      </main>
    );
  }

  if (menu.length === 0) {
    return (
      <main className="min-h-[calc(100svh-6rem)] flex items-center justify-center p-8 text-center">
        <p role="status">The menu is being updated. Please check back soon.</p>
      </main>
    );
  }

  const categoryImages: Record<string, string> = {
    pastas: "/temporary/m1.png",
    burgers: "/temporary/m2.png",
    pizzas: "/temporary/m3.png",
  };

  return (
    <main className="min-h-[calc(100svh-6rem)] bg-orange-50/50 px-4 py-12 md:px-10 lg:px-20 xl:px-40">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-red-500">Made fresh at Massimo</p>
        <h1 className="text-4xl font-bold text-stone-900 md:text-5xl">Explore our menu</h1>
        <p className="mt-4 text-stone-600">Choose a favorite and find your next great meal.</p>
      </header>
      <section aria-label="Menu categories" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {menu.map((category) => (
          <Link
            href={`/menu/${category.slug}`}
            key={category.id}
            className="group relative isolate flex min-h-[24rem] overflow-hidden rounded-2xl bg-stone-900 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <Image
              src={category.img || categoryImages[category.slug] || "/temporary/m3.png"}
              alt={`${category.title} menu`}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="relative z-10 mt-auto p-7 text-white">
              <h2 className="text-3xl font-bold">{category.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">{category.desc}</p>
              <span className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-2 text-sm font-semibold transition-colors group-hover:bg-red-600">
                Browse dishes <span aria-hidden="true" className="ml-2">→</span>
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default MenuPage;
