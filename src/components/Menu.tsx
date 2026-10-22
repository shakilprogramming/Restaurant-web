"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CartIcon from "./CartIcon";
import UserLinks from "./UserLinks";

const links = [
  { id: 1, title: "Homepage", url: "/" },
  { id: 2, title: "Menu", url: "/menu" },
  { id: 3, title: "Featured", url: "/#featured" },
  { id: 4, title: "Order Online", url: "/menu" },
];

const Menu = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div>
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Image
          src={open ? "/close.png" : "/open.png"}
          alt=""
          width={20}
          height={20}
          className="cursor-pointer"
        />
      </button>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="bg-red-500 text-white absolute left-0 top-full w-full max-h-[calc(100dvh-6rem)] overflow-y-auto flex flex-col gap-8 items-center justify-center py-8 text-3xl z-10"
        >
          {links.map((item) => (
            <Link href={item.url} key={item.id} onClick={() => setOpen(false)}>
              {item.title}
            </Link>
          ))}
          <UserLinks />
          <div onClick={() => setOpen(false)}>
            <CartIcon />
          </div>
        </nav>
      )}
    </div>
  );
};

export default Menu;
