"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const DeleteButton = ({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted?: () => void;
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated" || !session?.user.isAdmin) {
    return;
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    if (res.status === 200) {
      toast("The product has been deleted!");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/menu");
      }
    } else {
      const data = await res.json();
      toast.error(data.message);
    }
  };

  return (
    <button
      className="bg-red-400 hover:bg-red-500 text-white p-2 rounded-full ml-6"
      onClick={handleDelete}
      aria-label="Delete this product"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7h12m-10 0 .7 13h6.6L16 7M9 7V4h6v3m-4 4v5m2-5v5"
        />
      </svg>
    </button>
  );
};

export default DeleteButton;