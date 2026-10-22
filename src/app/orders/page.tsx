"use client";

import { OrderType } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-toastify";

const OrdersPage = () => {
  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const { isLoading, error, data } = useQuery<OrderType[]>({
    queryKey: ["orders"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Could not load your orders.");
      return response.json();
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method:"PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(status),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Could not update the order.");
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("The order status has been changed!");
    },
    onError(error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    },
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements[0] as HTMLInputElement;
    const status = input.value;

    mutation.mutate({ id, status });
  };

  if (isLoading || status === "loading") {
    return <p className="p-8 text-center" role="status">Loading orders...</p>;
  }
  if (status === "unauthenticated") return null;
  if (error) {
    return (
      <p className="p-8 text-center text-red-600" role="alert">
        {error instanceof Error ? error.message : "Could not load your orders."}
      </p>
    );
  }
  if (!data?.length) {
    return <p className="p-8 text-center">You do not have any orders yet.</p>;
  }

  return (
    <main className="p-4 lg:px-20 xl:px-40 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-separate border-spacing-3">
        <thead>
          <tr className="text-left">
            <th className="hidden md:table-cell">Order ID</th>
            <th>Date</th>
            <th>Price</th>
            <th className="hidden md:table-cell">Products</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr className={`${item.status !== "delivered" ? "bg-red-50" : ""}`} key={item.id}>
              <td className="hidden md:table-cell py-6 px-1">{item.id}</td>
              <td className="py-6 px-1">
                {item.createdAt.toString().slice(0, 10)}
              </td>
              <td className="py-6 px-1">{item.price}</td>
              <td className="hidden md:table-cell py-6 px-1">
                {item.products.map((product) => product.title).join(", ")}
              </td>
              {session?.user.isAdmin ? (
                <td>
                  <form
                    className="flex items-center justify-center gap-4"
                    onSubmit={(e) => handleUpdate(e, item.id)}
                  >
                    <input
                      placeholder={item.status}
                      className="p-2 ring-1 ring-red-100 rounded-md"
                    />
                    <button
                      type="submit"
                      aria-label={`Save status for order ${item.id}`}
                      className="bg-red-400 p-2 rounded-full"
                    >
                      <Image src="/edit.png" alt="" width={20} height={20} />
                    </button>
                  </form>
                </td>
              ) : (
                <td className="py-6 px-1">{item.status}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default OrdersPage;