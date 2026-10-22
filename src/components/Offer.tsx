import Image from "next/image";
import Link from "next/link";
import React from "react";

const Offer = () => {
  return (
    <section aria-labelledby="offer-title" className="bg-black min-h-[calc(100svh-3rem)] flex flex-col md:flex-row md:justify-between md:bg-[url('/offerBg.png')] md:min-h-[70vh]">
      {/* TEXT CONTAINER */}
      <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 p-6">
        <h2 id="offer-title" className="text-white text-4xl font-bold xl:text-6xl">Delicious Burger & French Fry</h2>
        <p className="text-white xl:text-xl">
          A delicious meal made fresh and ready to enjoy. Find your next
          favorite on our menu.
        </p>
        <Link
          href="/menu"
          className="bg-red-500 text-white rounded-md py-3 px-6"
        >
          Order Now
        </Link>
      </div>
      {/* IMAGE CONTAINER */}
      <div className="flex-1 w-full relative min-h-64 md:min-h-[70vh]">
        <Image src="/offerProduct.png" alt="Burger and fries" fill className="object-contain" />
      </div>
    </section>
  );
};

export default Offer;
