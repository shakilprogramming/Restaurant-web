"use client";

import { useEffect, useState } from "react";

type Category = {
  title: string;
  desc: string;
  color: string;
  img: string;
  slug: string;
};

type CategoryForm = Omit<Category, "slug">;

const emptyForm: CategoryForm = {
  title: "",
  desc: "",
  color: "white",
  img: "",
};

const responseMessage = async (response: Response, fallback: string) => {
  const result: unknown = await response.json();
  if (response.ok) return result;
  const message =
    result && typeof result === "object" && "message" in result
      ? result.message
      : fallback;
  throw new Error(typeof message === "string" ? message : fallback);
};

const DashboardCategories = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/categories", { signal });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? data.message
            : "Could not load categories.";
        throw new Error(
          typeof message === "string" ? message : "Could not load categories."
        );
      }
      if (!Array.isArray(data)) throw new Error("The categories response is invalid.");
      setCategories(data);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load categories."
      );
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const response = await fetch(
        editingSlug ? `/api/categories/${encodeURIComponent(editingSlug)}` : "/api/categories",
        {
          method: editingSlug ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      await responseMessage(response, "Could not save the category.");
      setForm(emptyForm);
      setEditingSlug(null);
      setSuccess(editingSlug ? "Category updated." : "Category created.");
      await loadCategories();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the category."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (
      !window.confirm(
        `Delete "${category.title}"? Categories with menu items cannot be deleted.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/categories/${encodeURIComponent(category.slug)}`,
        { method: "DELETE" }
      );
      await responseMessage(response, "Could not delete the category.");
      setCategories((current) =>
        current?.filter((item) => item.slug !== category.slug) ?? []
      );
      setSuccess("Category deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the category."
      );
    }
  };

  const beginEdit = (category: Category) => {
    setEditingSlug(category.slug);
    setForm({
      title: category.title,
      desc: category.desc,
      color: category.color,
      img: category.img,
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="border-b border-stone-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold text-stone-900">Category management</h2>
        <p className="mt-1 text-sm text-stone-500">
          Create, update, or remove menu categories.
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

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3 border-b border-stone-100 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-stone-800">
          {editingSlug ? "Edit category" : "Add a category"}
        </h3>
        <label className="block text-xs font-semibold text-stone-600" htmlFor="category-title">
          Title
          <input
            id="category-title"
            required
            maxLength={100}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-normal outline-none focus:border-orange-400"
          />
        </label>
        <label className="block text-xs font-semibold text-stone-600" htmlFor="category-description">
          Description
          <textarea
            id="category-description"
            required
            maxLength={2000}
            rows={2}
            value={form.desc}
            onChange={(event) => setForm((current) => ({ ...current, desc: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal outline-none focus:border-orange-400"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-stone-600" htmlFor="category-color">
            Theme color
            <input
              id="category-color"
              required
              maxLength={64}
              value={form.color}
              onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-normal outline-none focus:border-orange-400"
            />
          </label>
          <label className="block text-xs font-semibold text-stone-600" htmlFor="category-image">
            Image URL
            <input
              id="category-image"
              maxLength={2000}
              type="text"
              value={form.img}
              onChange={(event) => setForm((current) => ({ ...current, img: event.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-normal outline-none focus:border-orange-400"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-10 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : editingSlug ? "Save category" : "Create category"}
          </button>
          {editingSlug && (
            <button
              type="button"
              onClick={() => {
                setEditingSlug(null);
                setForm(emptyForm);
                setError(null);
              }}
              className="min-h-10 rounded-lg border border-stone-200 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {categories === null && !error ? (
        <p className="px-5 py-6 text-sm text-stone-500" role="status">
          Loading categories...
        </p>
      ) : categories?.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-500">
          No categories created yet.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {categories?.map((category) => (
            <li key={category.slug} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{category.title}</p>
                <p className="mt-1 truncate text-xs text-stone-500">{category.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => beginEdit(category)}
                className="min-h-9 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void deleteCategory(category)}
                className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default DashboardCategories;
