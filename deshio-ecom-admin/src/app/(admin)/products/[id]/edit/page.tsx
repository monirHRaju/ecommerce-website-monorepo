"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/api";
import type { Product, ApiResponse } from "@/types";
import ProductForm, { ProductFormValues } from "@/components/products/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return res.data.data;
    },
  });

  // Convert backend Product → form default values
  function toFormValues(p: Product): Partial<ProductFormValues> {
    return {
      title: p.title,
      description: p.description,
      price: p.price,
      discount: p.discount ?? 0,
      stock: p.stock,
      brand: p.brand ?? "",
      category: typeof p.category === "object" ? p.category._id : p.category,
      isFeatured: p.isFeatured ?? false,
      tags: (p.tags ?? []).join(", "),
      images: (p.images ?? []).map((url) => ({ url })),
      // Convert specifications Record → array of {key, value}
      specs: p.specifications
        ? Object.entries(p.specifications).map(([key, value]) => ({ key, value }))
        : [],
    };
  }

  async function handleSubmit(values: ProductFormValues) {
    const payload = {
      title: values.title,
      description: values.description,
      price: values.price,
      discount: values.discount,
      stock: values.stock,
      brand: values.brand || undefined,
      category: values.category,
      isFeatured: values.isFeatured,
      images: values.images.map((img) => img.url),
      tags: values.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      specifications: Object.fromEntries(
        values.specs.filter((s) => s.key && s.value).map((s) => [s.key, s.value])
      ),
    };

    await api.patch(`/products/${id}`, payload);
    toast.success("Product updated successfully!");
    router.push("/products");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Edit Product</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate max-w-sm">
            {product?.title ?? "Loading…"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : product ? (
        <ProductForm
          defaultValues={toFormValues(product)}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      ) : (
        <p className="text-center text-gray-400 py-16">Product not found.</p>
      )}
    </div>
  );
}
