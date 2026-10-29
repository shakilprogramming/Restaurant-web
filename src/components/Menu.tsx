"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CartIcon from "./CartIcon";
import UserLinks from "./UserLinks";

const links = [
  { id: 1, title: "Our Story", url: "/#story" },
  { id: 2, title: "Deals", url: "/#deals" },
  { id: 3, title: "Visit Us", url: "/#visit" },
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
      <div>
         <h1> Menu items</h1>
      </div>
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
        className="mobile-menu-panel"
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
