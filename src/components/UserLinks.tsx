"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const UserLinks = () => {
  const { data: session, status } = useSession();
  return (
    <div className="flex items-center gap-4 text-base">
      {status === "authenticated" ? (
        <>
          <Link href="/orders">Orders</Link>
          {session.user.isAdmin && <Link href="/dashboard">Dashboard</Link>}
          <button type="button" onClick={() => signOut()} className="uppercase">
            Logout
          </button>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </div>
  );
};

export default UserLinks;
