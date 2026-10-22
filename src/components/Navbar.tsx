import React from "react";
import Menu from "./Menu";
import Link from "next/link";
import CartIcon from "./CartIcon";
import UserLinks from "./UserLinks";

const Navbar = () => {
  return (
    <header className="site-header">
      {/* LEFT LINKS */}
      <div className="hidden md:flex gap-7 flex-1 text-sm normal-case font-medium text-stone-600">
        <Link href="/">Homepage</Link>
        <Link href="/menu">Menu</Link>
        <Link href="/#featured">Featured</Link>
      </div>
      {/* LOGO */}
      <div className="brand-mark text-xl md:font-bold flex-1 md:text-center">
        <Link href="/" aria-label="Massimo home"><span className="brand-icon">M</span> Massimo</Link>
      </div>
      {/* MOBILE MENU */}
      <div className="md:hidden">
        <Menu />
      </div>
      {/* RIGHT LINKS */}
      <div className="hidden md:flex gap-5 items-center justify-end flex-1 text-sm">
        <Link href="/menu" className="button-primary button-small">
          Order online
        </Link>
        <UserLinks />
        <CartIcon />
      </div>
    </header>
  );
};

export default Navbar;
