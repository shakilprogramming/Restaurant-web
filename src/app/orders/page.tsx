"use client";

import { OrderType } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-toastify";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));

const formatDate = (value: Date | string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const getStatusStyle = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("not paid")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  if (normalized === "delivered") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (normalized.includes("cancel")) {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }
  return "bg-orange-50 text-orange-800 ring-orange-200";
};

const OrdersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const { isLoading, error, data, refetch } = useQuery<OrderType[]>({
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      toast.error(
        error instanceof Error ? error.message : "Could not update the order."
      );
    },
  });

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("status");
    if (!(input instanceof HTMLInputElement) || !input.value.trim()) {
      toast.error("Enter an order status before saving.");
      return;
    }
    mutation.mutate({ id, status: input.value.trim() });
  };

  if (isLoading || status === "loading") {
    return (
      <main className="min-h-[calc(100svh-78px)] bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl" role="status">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
          <div className="mt-6 h-64 animate-pulse rounded-2xl border border-stone-200 bg-white" />
          <span className="sr-only">Loading orders...</span>
        </div>
      </main>
    );
  }
  if (status === "unauthenticated") return null;
  if (error) {
    return (
      <main className="min-h-[calc(100svh-78px)] bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-stone-900">Orders unavailable</h1>
          <p className="mt-2 text-sm text-stone-600" role="alert">
            {error instanceof Error ? error.message : "Could not load your orders."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 min-h-11 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100svh-78px)] bg-stone-50 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {session?.user.isAdmin && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Restaurant operations
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
              {session?.user.isAdmin ? "Orders" : "Your orders"}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              {session?.user.isAdmin
                ? `${data?.length ?? 0} orders in your restaurant`
                : "View the status and details of your orders."}
            </p>
          </div>
        </header>

        {!data?.length ? (
          <section className="rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-xl text-orange-700"
            >
              —
            </span>
            <h2 className="mt-4 font-semibold text-stone-900">No orders yet</h2>
            <p className="mt-1 text-sm text-stone-500">
              {session?.user.isAdmin
                ? "New customer orders will appear here."
                : "Your order history will appear here after checkout."}
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">Restaurant orders</caption>
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">Order</th>
                    <th scope="col" className="px-5 py-4">Customer</th>
                    <th scope="col" className="px-5 py-4">Date</th>
                    <th scope="col" className="px-5 py-4">Items</th>
                    <th scope="col" className="px-5 py-4">Total</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    {session?.user.isAdmin && (
                      <th scope="col" className="px-5 py-4">Update</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.map((item) => (
                    <tr key={item.id} className="align-middle hover:bg-stone-50/70">
                      <td className="px-5 py-4 font-semibold text-stone-800">
                        #{item.id.slice(-8)}
                      </td>
                      <td className="max-w-52 truncate px-5 py-4 text-sm text-stone-600">
                        {item.userEmail}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="max-w-64 truncate px-5 py-4 text-sm text-stone-600">
                        {item.products.map((product) => product.title).join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-stone-900">
                        {formatCurrency(Number(item.price))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      {session?.user.isAdmin && (
                        <td className="px-5 py-4">
                          <form
                            className="flex items-center gap-2"
                            onSubmit={(event) => handleUpdate(event, item.id)}
                          >
                            <label className="sr-only" htmlFor={`status-${item.id}`}>
                              New status for order {item.id}
                            </label>
                            <input
                              id={`status-${item.id}`}
                              name="status"
                              defaultValue={item.status}
                              className="h-10 w-36 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-orange-400"
                            />
                            <button
                              type="submit"
                              disabled={mutation.isPending}
                              aria-label={`Save status for order ${item.id}`}
                              className="h-10 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                            >
                              Save
                            </button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-stone-100 md:hidden">
              {data.map((item) => (
                <li key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-900">
                        {session?.user.isAdmin ? item.userEmail : `Order #${item.id.slice(-8)}`}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        #{item.id.slice(-8)} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">
                    {item.products.map((product) => product.title).join(", ")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Order total</span>
                    <span className="text-sm font-bold text-stone-900">
                      {formatCurrency(Number(item.price))}
                    </span>
                  </div>
                  {session?.user.isAdmin && (
                    <form
                      className="flex gap-2 border-t border-stone-100 pt-3"
                      onSubmit={(event) => handleUpdate(event, item.id)}
                    >
                      <label className="sr-only" htmlFor={`mobile-status-${item.id}`}>
                        New status for order {item.id}
                      </label>
                      <input
                        id={`mobile-status-${item.id}`}
                        name="status"
                        defaultValue={item.status}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-orange-400"
                      />
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="min-h-11 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
};

export default OrdersPage;
