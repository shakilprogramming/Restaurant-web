"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: "M4 5h16M4 12h16M4 19h16",
  },
  {
    href: "/add",
    label: "Menu management",
    icon: "M4 5h16M4 12h16M4 19h16M8 5v.01M8 12v.01M8 19v.01",
  },
];

const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const currentPage = navigation.find((item) => item.href === pathname);

  return (
    <div className="min-h-[calc(100svh-78px)] bg-stone-50 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100svh-78px)] max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white px-5 py-7 lg:flex lg:flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 font-serif text-xl font-bold text-white shadow-sm">
              M
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">Massimo</span>
              <span className="mt-0.5 block text-xs text-stone-500">Restaurant admin</span>
            </span>
          </Link>

          <p className="mb-3 mt-10 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
            Workspace
          </p>
          <nav aria-label="Admin navigation" className="space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-950"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-stone-100 pt-5">
            <Link
              href="/"
              className="flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-950"
            >
              View storefront
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-1 flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-950"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-h-10 items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-900">
                  {currentPage?.label ?? "Restaurant admin"}
                </p>
                <p className="hidden text-xs text-stone-500 sm:block">
                  Manage your restaurant operations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden max-w-56 truncate text-sm text-stone-600 sm:block">
                  {session?.user.email}
                </span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800"
                >
                  {(session?.user.name ?? session?.user.email ?? "A")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="min-h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 lg:hidden"
                >
                  Sign out
                </button>
              </div>
            </div>
            <nav
              aria-label="Admin navigation"
              className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            >
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? "bg-orange-100 text-orange-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
