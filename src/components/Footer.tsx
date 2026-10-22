import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="min-h-12 md:min-h-24 p-4 lg:px-20 xl:px-40 text-red-500 flex flex-wrap gap-3 items-center justify-between">
      <Link href="/" className="font-bold text-xl">MASSIMO</Link>
      <p>© {new Date().getFullYear()} MASSIMO. ALL RIGHTS RESERVED.</p>
      <Link href="/menu">Browse the menu</Link>
    </footer>
  );
};

export default Footer;
