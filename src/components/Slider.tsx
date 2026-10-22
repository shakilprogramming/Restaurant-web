"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const data = [
  {
    id: 1,
    title: "Always fresh, crispy, and served hot",
    image: "/slide1.png",
    alt: "Freshly baked pizza ready to serve",
  },
  {
    id: 2,
    title: "Your favorite meal, delivered to your door",
    image: "/slide2.png",
    alt: "A restaurant meal prepared for delivery",
  },
  {
    id: 3,
    title: "Pizza made to share with family and friends",
    image: "/slide3.jpg",
    alt: "Pizza for sharing",
  },
];

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(
      () =>
        setCurrentSlide((prev) => (prev === data.length - 1 ? 0 : prev + 1)),
      4000
    );
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section
      aria-label="Restaurant highlights"
      aria-live="polite"
      className="flex flex-col min-h-[calc(100svh-6rem)] md:min-h-[calc(100svh-9rem)] lg:flex-row bg-fuchsia-50"
    >
      {/* TEXT CONTAINER */}
      <div className="flex-1 flex items-center justify-center flex-col gap-8 text-red-500 font-bold">
        <h1 className="text-4xl text-center uppercase p-4 md:p-10 md:text-6xl xl:text-7xl">
          {data[currentSlide].title}
        </h1>
        <Link
          href="/menu"
          className="bg-red-500 text-white py-4 px-8"
        >
          Order Now
        </Link>
        <button
          type="button"
          className="text-sm underline"
          aria-label={isPaused ? "Resume highlights" : "Pause highlights"}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? "Resume slides" : "Pause slides"}
        </button>
      </div>
      {/* IMAGE CONTAINER */}
      <div className="w-full flex-1 relative">
        <Image
          src={data[currentSlide].image}
          alt={data[currentSlide].alt}
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
};

export default Slider;
