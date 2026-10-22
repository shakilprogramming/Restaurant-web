"use client";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const LoginPage = () => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <p className="p-8 text-center" role="status">Loading...</p>;
  }

  return (
    <div className="p-4 h-[calc(100vh-6rem)] md:h-[calc(100vh-9rem)] flex items-center justify-center">
      {/* BOX */}
      <div className=" h-full shadow-2xl rounded-md flex flex-col md:flex-row md:h-[70%] md:w-full lg:w-[60%] 2xl:w-1/2">
        {/* IMAGE CONTAINER */}
        <div className="relative h-1/3 w-full md:h-full md:w-1/2">
          <Image
            src="/loginBg.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        </div>
        {/* FORM CONTAINER */}
        <div className="p-10 flex flex-col gap-8 md:w-1/2">
          <h1 className="font-bold text-xl xl:text-3xl">Welcome</h1>
          <p>Sign in or create an account to place and track your orders.</p>
          <button
            className="flex gap-4 p-4 ring-1 ring-orange-100 rounded-md"
            onClick={() => signIn("google")}
          >
            <Image
              src="/google.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span>Sign in with Google</span>
          </button>
          <p className="text-sm">
            New here?{" "}
            <Link className="underline" href="/menu">
              Browse the menu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
