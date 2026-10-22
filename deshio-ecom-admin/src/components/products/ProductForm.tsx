"use client";
import { useState, useMemo } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Category, ApiResponse, Gender } from "@/types";
import { PlusIcon, TrashBinIcon, BoltIcon } from "@/icons";
import ImageUpload from "@/components/ui/ImageUpload";

// ─── schema ──────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().min(0, "Stock cannot be negative"),
  priceOverride: z.number().min(0).optional(),
});

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  discount: z.number().min(0).max(100),
  stock: z.number().min(0).default(0),
  brand: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  gender: z.enum(["men", "women", "kids", "unisex"]).default("unisex"),
  material: z.string().optional(),
  fit: z.string().optional(),
  careInstructions: z.string().optional(),
  sizeGuide: z.string().optional(),
  isFeatured: z.boolean(),
  tags: z.string(), // comma-separated, converted on submit
  images: z
    .array(z.object({ url: z.string().url("Must be a valid URL") }))
    .min(1, "Add at least one image"),
  variants: z.array(variantSchema).default([]),
  specs: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })).default([]),
});

export type ProductFormValues = z.infer<typeof schema>;

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
}

export default function ProductForm({ defaultValues, onSubmit, submitLabel }: Props) {
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false);
  const [aiLoadingTags, setAiLoadingTags] = useState(false);

  // Bulk variant generator state
  const [bulkSizes, setBulkSizes] = useState("S, M, L, XL");
  const [bulkColors, setBulkColors] = useState("Black, White");
  const [bulkStock, setBulkStock] = useState(10);

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
      slug: "",
      description: "",
      price: 0,
      discount: 0,
      stock: 0,
      brand: "",
      category: "",
      gender: "unisex",
      material: "",
      fit: "",
      careInstructions: "",
      sizeGuide: "",
      isFeatured: false,
      tags: "",
      images: [{ url: "" }],
      variants: [],
      specs: [],
      ...defaultValues,
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control, name: "specs" });

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
  const watchedGender = watch("gender");
  const watchedMaterial = watch("material");
  const watchedFit = watch("fit");
  const watchedSpecs = watch("specs");
  const watchedVariants = watch("variants");
  const watchedPrice = watch("price");
  const watchedDiscount = watch("discount");

  const categories = categoriesData ?? [];
  const catName = categories.find((c) => c._id === watchedCategory)?.name ?? watchedCategory;

  // Calculate live total stock from variants if variants exist
  const totalStock = useMemo(() => {
    if (!watchedVariants || watchedVariants.length === 0) {
      return watch("stock") ?? 0;
    }
    return watchedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [watchedVariants, watch]);

  // Bulk generate variants helper
  const handleBulkGenerate = () => {
    const sizes = bulkSizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = bulkColors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (sizes.length === 0 || colors.length === 0) {
      toast.error("Please enter at least one size and one color");
      return;
    }

    const current = watch("variants") ?? [];
    const newItems: Array<{
      size: string;
      color: string;
      colorHex?: string;
      sku?: string;
      stock: number;
      priceOverride?: number;
    }> = [];

    for (const c of colors) {
      for (const s of sizes) {
        const exists = current.some(
          (item) =>
            item.size.toLowerCase() === s.toLowerCase() &&
            item.color.toLowerCase() === c.toLowerCase()
        );
        if (!exists) {
          newItems.push({
            size: s,
            color: c,
            stock: Math.max(0, bulkStock),
          });
        }
      }
    }

    if (newItems.length === 0) {
      toast("All selected variants already exist in the list", { icon: "ℹ️" });
      return;
    }

    setValue("variants", [...current, ...newItems], { shouldValidate: true });
    toast.success(`Added ${newItems.length} variant(s)`);
  };

  // ── AI description ──
  async function generateDescription() {
    if (!watchedTitle || !watchedCategory) {
      toast.error("Fill in title and category first");
      return;
    }
    setAiLoadingDesc(true);
    try {
      const specs = (watchedSpecs ?? [])
        .filter((s) => s.key && s.value)
        .map((s) => `${s.key}: ${s.value}`);

      const res = await api.post<ApiResponse<{ description: string }>>(
        "/ai/generate-description",
        {
          title: watchedTitle,
          category: catName,
          brand: watchedBrand || undefined,
          gender: watchedGender || undefined,
          material: watchedMaterial || undefined,
          fit: watchedFit || undefined,
          specs: specs.length ? specs : undefined,
        }
      );
      setValue("description", res.data.data.description, { shouldValidate: true });
      toast.success("AI fashion description generated");
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
        gender: watchedGender || undefined,
        material: watchedMaterial || undefined,
      });
      setValue("tags", res.data.data.tags.join(", "), { shouldValidate: true });
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
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Basic Information
            </h3>

            {/* title & slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g. Relaxed Pure Linen Camp Shirt"
                  className="input-field"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL Slug <span className="text-xs text-gray-400 font-normal">(auto-generated if empty)</span>
                </label>
                <input
                  {...register("slug")}
                  placeholder="e.g. relaxed-pure-linen-camp-shirt"
                  className="input-field"
                />
              </div>
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
                  {aiLoadingDesc ? "Generating…" : "AI Generate Description"}
                </button>
              </div>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="Editorial style description, fabric details, silhouette and styling versatility…"
                className="input-field resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* price / discount / base stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Price (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
                )}
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
                  Total Stock <span className="text-xs text-gray-400 font-normal">(derived)</span>
                </label>
                <input
                  type="number"
                  value={totalStock}
                  readOnly={Boolean(watchedVariants && watchedVariants.length > 0)}
                  {...(!watchedVariants || watchedVariants.length === 0
                    ? register("stock", { valueAsNumber: true })
                    : {})}
                  className="input-field bg-gray-50 dark:bg-gray-800/50 cursor-default"
                />
              </div>
            </div>

            {/* category / brand / gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <select {...register("category")} className="input-field">
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Collection / Gender
                </label>
                <select {...register("gender")} className="input-field">
                  <option value="unisex">Unisex</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand / Label
                </label>
                <input
                  {...register("brand")}
                  placeholder="e.g. Atelier Dhaka"
                  className="input-field"
                />
              </div>
            </div>

            {/* material / fit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Material / Fabric
                </label>
                <input
                  {...register("material")}
                  placeholder="e.g. 100% European Flax Linen"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fit / Silhouette
                </label>
                <input
                  {...register("fit")}
                  placeholder="e.g. Relaxed Fit, Regular Tapered"
                  className="input-field"
                />
              </div>
            </div>

            {/* care instructions & size guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Care Instructions
                </label>
                <input
                  {...register("careInstructions")}
                  placeholder="e.g. Machine wash cold on gentle cycle, line dry"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Size Guide Note
                </label>
                <input
                  {...register("sizeGuide")}
                  placeholder="e.g. True to size. Model is 6'1 wearing size M"
                  className="input-field"
                />
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
                placeholder="linen, shirt, summer, menswear, breathable"
                className="input-field"
              />
            </div>
          </div>

          {/* Variants Card (Size x Color x Stock Matrix) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">
                  Product Variants
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    ({variantFields.length} variants, {totalStock} total units)
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Specify size, color, stock, and optional price override per variant.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  appendVariant({
                    size: "M",
                    color: "Standard",
                    stock: 10,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Single Variant
              </button>
            </div>

            {/* Quick Generator Box */}
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-800/20 space-y-2.5">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Quick Variant Generator
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500">Sizes (comma-separated)</label>
                  <input
                    type="text"
                    value={bulkSizes}
                    onChange={(e) => setBulkSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="input-field text-xs py-1.5"
                  />
                  <div className="flex gap-1 mt-1">
                    {["S, M, L, XL", "XS, S, M, L, XL, XXL", "Free Size"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBulkSizes(preset)}
                        className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {preset.split(",")[0] === "XS" ? "Full range" : preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500">Colors (comma-separated)</label>
                  <input
                    type="text"
                    value={bulkColors}
                    onChange={(e) => setBulkColors(e.target.value)}
                    placeholder="Black, White, Navy"
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-gray-500">Default Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(Number(e.target.value))}
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkGenerate}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 shrink-0 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Variant list table */}
            {variantFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No variants configured yet. Use the generator above or add individual variants.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {variantFields.map((field, i) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 text-xs"
                  >
                    <div className="w-20">
                      <label className="text-[10px] text-gray-400 block">Size</label>
                      <input
                        {...register(`variants.${i}.size`)}
                        placeholder="Size"
                        className="input-field text-xs py-1 px-2"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] text-gray-400 block">Color</label>
                      <input
                        {...register(`variants.${i}.color`)}
                        placeholder="Color"
                        className="input-field text-xs py-1 px-2"
                      />
                    </div>
                    <div className="w-16">
                      <label className="text-[10px] text-gray-400 block">Hex</label>
                      <input
                        type="color"
                        {...register(`variants.${i}.colorHex`)}
                        className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-gray-400 block">Stock</label>
                      <input
                        type="number"
                        min="0"
                        {...register(`variants.${i}.stock`, { valueAsNumber: true })}
                        className="input-field text-xs py-1 px-2"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] text-gray-400 block">Price Override (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Default"
                        {...register(`variants.${i}.priceOverride`, {
                          setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
                        })}
                        className="input-field text-xs py-1 px-2"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[10px] text-gray-400 block">SKU</label>
                      <input
                        {...register(`variants.${i}.sku`)}
                        placeholder="Auto-generated"
                        className="input-field text-xs py-1 px-2 text-gray-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-3"
                      title="Remove variant"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specifications / Extra Details card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">
                  Additional Specifications
                </h3>
                <p className="text-xs text-gray-400">
                  Key-value pairs for technical specs (e.g. Pattern, Collar, Weave, Origin).
                </p>
              </div>
              <button
                type="button"
                onClick={() => appendSpec({ key: "", value: "" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Detail
              </button>
            </div>
            {specFields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">
                No extra specifications added yet.
              </p>
            )}
            {specFields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`specs.${i}.key`)}
                  placeholder="e.g. Weave Type"
                  className="input-field flex-1 text-sm"
                />
                <input
                  {...register(`specs.${i}.value`)}
                  placeholder="e.g. Plain Weave 165 GSM"
                  className="input-field flex-1 text-sm"
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
                Product Images
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
                  folder="fashion-admin/products"
                  aspectRatio="portrait"
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
            <h3 className="font-semibold text-gray-800 dark:text-white/90">Settings & Visibility</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured Product
                </p>
                <p className="text-xs text-gray-400">Display in curated featured collections</p>
              </div>
              <div className="relative">
                <input type="checkbox" {...register("isFeatured")} className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer dark:bg-gray-700 peer-checked:bg-brand-500 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            {/* Price preview */}
            {watchedPrice > 0 && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Customer Price Preview
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    ৳{(watchedPrice * (1 - (watchedDiscount ?? 0) / 100)).toFixed(2)}
                  </span>
                  {(watchedDiscount ?? 0) > 0 && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ৳{watchedPrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-1.5 py-0.5 rounded">
                        -{watchedDiscount}%
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
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
