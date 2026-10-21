"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Category, ApiResponse } from "@/types";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import ImageUpload from "@/components/ui/ImageUpload";

// ─── schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  image: z.string().optional(),
  parentCategory: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ─── helpers ─────────────────────────────────────────────────────────────────

function parentName(cat: Category, all: Category[]) {
  if (!cat.parentCategory) return null;
  const parentId =
    typeof cat.parentCategory === "object"
      ? cat.parentCategory._id
      : cat.parentCategory;
  return all.find((c) => c._id === parentId)?.name ?? null;
}

// ─── skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-100 dark:bg-gray-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  // modal state: null = closed, "create" = new, Category object = editing
  const [modal, setModal] = useState<null | "create" | Category>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ── fetch all categories ──
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>("/categories");
      return res.data.data;
    },
  });

  // ── create mutation ──
  const createMutation = useMutation({
    mutationFn: (body: Omit<FormValues, "image"> & { image?: string }) =>
      api.post("/categories", body),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setModal(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create category";
      toast.error(msg);
    },
  });

  // ── update mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FormValues> }) =>
      api.patch(`/categories/${id}`, body),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setModal(null);
    },
    onError: () => toast.error("Failed to update category"),
  });

  // ── delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete category"),
  });

  // ── form ──
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as import("react-hook-form").Resolver<FormValues>,
    defaultValues: { name: "", description: "", image: "", parentCategory: "" },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (modal === "create") {
      reset({ name: "", description: "", image: "", parentCategory: "" });
    } else if (modal && typeof modal === "object") {
      const parentId =
        modal.parentCategory && typeof modal.parentCategory === "object"
          ? modal.parentCategory._id
          : (modal.parentCategory as string | undefined) ?? "";
      reset({
        name: modal.name,
        description: modal.description ?? "",
        image: modal.image ?? "",
        parentCategory: parentId,
      });
    }
  }, [modal, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      image: values.image || undefined,
      parentCategory: values.parentCategory || undefined,
    };

    if (modal === "create") {
      await createMutation.mutateAsync(payload);
    } else if (modal && typeof modal === "object") {
      await updateMutation.mutateAsync({ id: modal._id, body: payload });
    }
  }

  const imagePreview = watch("image");
  const isEditing = modal && typeof modal === "object";

  // categories available as parent (exclude current when editing)
  const parentOptions = categories.filter(
    (c) => !isEditing || c._id !== (modal as Category)._id
  );

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} total
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : categories.map((cat) => {
              const parent = parentName(cat, categories);
              return (
                <div
                  key={cat._id}
                  className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden group"
                >
                  {/* image */}
                  <div className="relative h-32 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.image ?? "https://placehold.co/400x300"}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x300";
                      }}
                    />
                    {/* parent badge */}
                    {parent && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
                        {parent}
                      </span>
                    )}
                    {!cat.parentCategory && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/80 text-white backdrop-blur-sm">
                        Main
                      </span>
                    )}
                  </div>

                  {/* info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 truncate">
                      {cat.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400 font-mono truncate">
                      /{cat.slug}
                    </p>
                    {cat.description && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {cat.description}
                      </p>
                    )}

                    {/* actions */}
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => setModal(cat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <TrashBinIcon className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

        {!isLoading && categories.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p className="text-sm">No categories yet.</p>
            <button
              onClick={() => setModal("create")}
              className="mt-2 text-sm text-brand-500 hover:underline"
            >
              Create your first category →
            </button>
          </div>
        )}
      </div>

      {/* ── create / edit modal ── */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {isEditing ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* modal body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* image upload */}
              <ImageUpload
                value={imagePreview || undefined}
                onChange={(url) => setValue("image", url)}
                folder="deshio-admin/categories"
                aspectRatio="wide"
                label="Category Image"
              />

              {/* name */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Smartphones"
                  className="input-field"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* description */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Short description…"
                  className="input-field resize-none"
                />
              </div>

              {/* parent category */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parent Category{" "}
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <select {...register("parentCategory")} className="input-field">
                  <option value="">— None (main category) —</option>
                  {parentOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting || createMutation.isPending || updateMutation.isPending
                    ? "Saving…"
                    : isEditing
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <TrashBinIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Delete &quot;{deleteTarget.name}&quot;?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Products in this category will become uncategorised.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
