"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from "react";
import AdminShell from "./AdminShell";
import Footer from "./Footer";
import Navbar from "./Navbar";

const SiteChrome = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdminPath =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/add" ||
    pathname.startsWith("/add/") ||
    (pathname === "/orders" &&
      status === "authenticated" &&
      session?.user.isAdmin);

  if (isAdminPath) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

export default SiteChrome;
