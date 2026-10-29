"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  orderCount: number;
};

const DashboardCustomers = () => {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/users", { signal: controller.signal });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? data.message
              : "Could not load customers.";
          throw new Error(
            typeof message === "string" ? message : "Could not load customers."
          );
        }
        if (
          !Array.isArray(data) ||
          !data.every(
            (customer) =>
              customer &&
              typeof customer.id === "string" &&
              typeof customer.orderCount === "number"
          )
        ) {
          throw new Error("The customers response is invalid.");
        }
        setCustomers(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load customers."
        );
      }
    };

    void loadCustomers();
    return () => controller.abort();
  }, []);

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers ?? [];
    return (customers ?? []).filter(
      (customer) =>
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query)
    );
  }, [customers, search]);

  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>, customer: Customer) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() || null }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "Could not update customer.";
        throw new Error(
          typeof message === "string" ? message : "Could not update customer."
        );
      }

      setCustomers((current) =>
        current?.map((item) =>
          item.id === customer.id ? { ...item, name: editName.trim() || null } : item
        ) ?? null
      );
      setEditingId(null);
      setSuccess("Customer updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not update customer."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (
      !window.confirm(
        `Delete ${customer.name || customer.email || "this customer"}? This cannot be undone.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/users/${customer.id}`, {
        method: "DELETE",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "Could not delete customer.";
        throw new Error(
          typeof message === "string" ? message : "Could not delete customer."
        );
      }
      setCustomers((current) =>
        current?.filter((item) => item.id !== customer.id) ?? []
      );
      setSuccess("Customer deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete customer."
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="border-b border-stone-100 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Customer management</h2>
            <p className="mt-1 text-sm text-stone-500">
              Search, update names, and manage customer accounts.
            </p>
          </div>
          {customers && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              {customers.length} customers
            </span>
          )}
        </div>
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          className="mt-4 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-orange-400"
        />
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
      {customers === null && !error ? (
        <p className="px-5 py-6 text-sm text-stone-500" role="status">
          Loading customers...
        </p>
      ) : visibleCustomers.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-500">
          {customers?.length ? "No customers match that search." : "No customers yet."}
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {visibleCustomers.map((customer) => (
            <li key={customer.id} className="space-y-3 px-5 py-4 sm:px-6">
              {editingId === customer.id ? (
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => void saveCustomer(event, customer)}
                >
                  <label className="min-w-40 flex-1 text-xs font-semibold text-stone-600">
                    Customer name
                    <input
                      autoFocus
                      maxLength={120}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-normal outline-none focus:border-orange-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-10 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="min-h-10 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {customer.name || "No name"}
                    </p>
                    <p className="mt-1 break-all text-xs text-stone-500">
                      {customer.email ?? "No email"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {customer.orderCount}{" "}
                      {customer.orderCount === 1 ? "order" : "orders"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(customer.id);
                        setEditName(customer.name ?? "");
                        setError(null);
                      }}
                      className="min-h-9 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Edit name
                    </button>
                    <button
                      type="button"
                      disabled={customer.orderCount > 0}
                      title={
                        customer.orderCount > 0
                          ? "Customers with order history cannot be deleted."
                          : undefined
                      }
                      onClick={() => void deleteCustomer(customer)}
                      className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-stone-100 px-5 py-3 text-xs text-stone-500 sm:px-6">
        Email addresses are fixed. Accounts with order history can’t be deleted, so order records are retained.
      </p>
    </section>
  );
};

export default DashboardCustomers;
