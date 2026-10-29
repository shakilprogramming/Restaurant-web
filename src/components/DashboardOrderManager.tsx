"use client";

import { useEffect, useState } from "react";

type DashboardOrder = {
  id: string;
  createdAt: string;
  price: number | string;
  status: string;
  userEmail: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const DashboardOrderManager = () => {
  const [orders, setOrders] = useState<DashboardOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Could not load orders.";
          throw new Error(
            typeof message === "string" ? message : "Could not load orders."
          );
        }
        if (!Array.isArray(data)) {
          throw new Error("The orders response is invalid.");
        }
        setOrders(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Could not load orders."
        );
      }
    };

    void loadOrders();
    return () => controller.abort();
  }, []);

  const updateOrder = async (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget).get("status");
    if (typeof input !== "string" || !input.trim()) {
      setError("Enter a status before saving.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSavingId(id);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.trim()),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "Could not update order status.";
        throw new Error(
          typeof message === "string" ? message : "Could not update order status."
        );
      }

      setOrders((current) =>
        current?.map((order) =>
          order.id === id ? { ...order, status: input.trim() } : order
        ) ?? null
      );
      setSuccess("Order status updated.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update order status."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="border-b border-stone-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold text-stone-900">Order management</h2>
        <p className="mt-1 text-sm text-stone-500">
          Update statuses for your latest orders.
        </p>
      </header>

      {error && (
        <p className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-700" role="status">
          {success}
        </p>
      )}
      {orders === null && !error ? (
        <p className="px-5 py-6 text-sm text-stone-500" role="status">
          Loading orders...
        </p>
      ) : orders?.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-500">
          No orders to manage yet.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {orders?.slice(0, 5).map((order) => (
            <li key={order.id} className="space-y-3 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">
                    {order.userEmail}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Order #{order.id.slice(-8)} · {formatDate(order.createdAt)} ·{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(order.price))}
                  </p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">
                  {order.status}
                </span>
              </div>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(event) => void updateOrder(event, order.id)}
              >
                <label className="sr-only" htmlFor={`dashboard-status-${order.id}`}>
                  New status for order {order.id}
                </label>
                <input
                  id={`dashboard-status-${order.id}`}
                  name="status"
                  defaultValue={order.status}
                  maxLength={80}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-orange-400"
                />
                <button
                  type="submit"
                  disabled={savingId === order.id}
                  className="min-h-10 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {savingId === order.id ? "Saving..." : "Save status"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default DashboardOrderManager;
