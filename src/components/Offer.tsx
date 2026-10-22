import Image from "next/image";
import Link from "next/link";
import React from "react";

const Offer = () => {
  return (
    <section aria-labelledby="offer-title" className="offer-section">
      {/* TEXT CONTAINER */}
      <div className="offer-copy">
        <p className="eyebrow">A Massimo favorite</p>
        <h2 id="offer-title">Something delicious is waiting.</h2>
        <p>
          A delicious meal made fresh and ready to enjoy. Find your next
          favorite on our menu.
        </p>
        <Link
          href="/menu"
          className="button-primary"
        >
          Order Now
        </Link>
      </div>
      {/* IMAGE CONTAINER */}
      <div className="offer-visual">
        <Image
          src="/offerProduct.png"
          alt="Burger and fries"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
    </section>
  );
};

export default Offer;
