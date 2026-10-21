"use client";
import { useState } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Category, ApiResponse } from "@/types";
import { PlusIcon, TrashBinIcon, BoltIcon } from "@/icons";
import ImageUpload from "@/components/ui/ImageUpload";

// ─── schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  discount: z.number().min(0).max(100),
  stock: z.number().min(0),
  brand: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  isFeatured: z.boolean(),
  tags: z.string(), // comma-separated, converted on submit
  images: z.array(z.object({ url: z.string().url("Must be a valid URL") })).min(1, "Add at least one image URL"),
  specs: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })),
});

export type ProductFormValues = z.infer<typeof schema>;

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ProductForm({ defaultValues, onSubmit, submitLabel }: Props) {
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false);
  const [aiLoadingTags, setAiLoadingTags] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      discount: 0,
      stock: 0,
      brand: "",
      category: "",
      isFeatured: false,
      tags: "",
      images: [{ url: "" }],
      specs: [],
      ...defaultValues,
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: "images" });
  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control, name: "specs" });

  // categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>("/categories");
      return res.data.data;
    },
  });

  const watchedTitle = watch("title");
  const watchedCategory = watch("category");
  const watchedBrand = watch("brand");
  const watchedSpecs = watch("specs");
  const categories = categoriesData ?? [];

  // Get category name for AI
  const catName = categories.find((c) => c._id === watchedCategory)?.name ?? watchedCategory;

  // ── AI description ──
  async function generateDescription() {
    if (!watchedTitle || !watchedCategory) {
      toast.error("Fill in title and category first");
      return;
    }
    setAiLoadingDesc(true);
    try {
      const specs = watchedSpecs
        .filter((s) => s.key && s.value)
        .map((s) => `${s.key}: ${s.value}`);
      const res = await api.post<ApiResponse<{ description: string }>>("/ai/generate-description", {
        title: watchedTitle,
        category: catName,
        brand: watchedBrand || undefined,
        specs: specs.length ? specs : undefined,
      });
      setValue("description", res.data.data.description);
      toast.success("AI description generated");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setAiLoadingDesc(false);
    }
  }

  // ── AI tags ──
  async function generateTags() {
    if (!watchedTitle || !watchedCategory) {
      toast.error("Fill in title and category first");
      return;
    }
    setAiLoadingTags(true);
    try {
      const res = await api.post<ApiResponse<{ tags: string[] }>>("/ai/generate-tags", {
        title: watchedTitle,
        category: catName,
      });
      setValue("tags", res.data.data.tags.join(", "));
      toast.success("AI tags generated");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setAiLoadingTags(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── left col (2/3) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Basic Info card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">Basic Information</h3>

            {/* title */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="Product title"
                className="input-field"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* description + AI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={aiLoadingDesc}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                >
                  <BoltIcon className="w-3.5 h-3.5" />
                  {aiLoadingDesc ? "Generating…" : "AI Generate"}
                </button>
              </div>
              <textarea
                {...register("description")}
                rows={6}
                placeholder="Product description…"
                className="input-field resize-none"
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* price / discount / stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register("discount", { valueAsNumber: true })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("stock", { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
              </div>
            </div>

            {/* brand / category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand
                </label>
                <input
                  {...register("brand")}
                  placeholder="e.g. Apple"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <select {...register("category")} className="input-field">
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
              </div>
            </div>

            {/* tags + AI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags <span className="text-xs text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <button
                  type="button"
                  onClick={generateTags}
                  disabled={aiLoadingTags}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                >
                  <BoltIcon className="w-3.5 h-3.5" />
                  {aiLoadingTags ? "Generating…" : "AI Tags"}
                </button>
              </div>
              <input
                {...register("tags")}
                placeholder="laptop, electronics, apple…"
                className="input-field"
              />
            </div>
          </div>

          {/* Specifications card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white/90">Specifications</h3>
              <button
                type="button"
                onClick={() => appendSpec({ key: "", value: "" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Spec
              </button>
            </div>
            {specFields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">No specifications added yet.</p>
            )}
            {specFields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`specs.${i}.key`)}
                  placeholder="e.g. RAM"
                  className="input-field flex-1"
                />
                <input
                  {...register(`specs.${i}.value`)}
                  placeholder="e.g. 16GB"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── right col (1/3) ── */}
        <div className="space-y-5">

          {/* Images card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white/90">
                Images
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  ({imageFields.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => appendImage({ url: "" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Image
              </button>
            </div>

            {errors.images && (
              <p className="text-xs text-red-500">
                {(errors.images as { message?: string })?.message ?? "Add at least one image"}
              </p>
            )}

            {imageFields.map((field, i) => (
              <div key={field.id} className="relative">
                <ImageUpload
                  value={watch(`images.${i}.url`)}
                  onChange={(url) => setValue(`images.${i}.url`, url, { shouldValidate: true })}
                  folder="deshio-admin/products"
                  aspectRatio="wide"
                />
                {imageFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow transition-colors"
                    title="Remove image"
                  >
                    <TrashBinIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Settings card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">Settings</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured product</p>
                <p className="text-xs text-gray-400">Show on homepage hero section</p>
              </div>
              <div className="relative">
                <input type="checkbox" {...register("isFeatured")} className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer dark:bg-gray-700 peer-checked:bg-brand-500 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            {/* price preview */}
            {watch("price") > 0 && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price Preview</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-800 dark:text-white">
                    ৳{(watch("price") * (1 - (watch("discount") ?? 0) / 100)).toFixed(2)}
                  </span>
                  {(watch("discount") ?? 0) > 0 && (
                    <>
                      <span className="text-sm text-gray-400 line-through">৳{watch("price").toFixed(2)}</span>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-1.5 py-0.5 rounded">
                        -{watch("discount")}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
