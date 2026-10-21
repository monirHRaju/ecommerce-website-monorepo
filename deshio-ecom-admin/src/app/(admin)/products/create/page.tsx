"use client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/api";
import ProductForm, { ProductFormValues } from "@/components/products/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();

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
      // Convert spec array → plain object (Map)
      specifications: Object.fromEntries(
        values.specs.filter((s) => s.key && s.value).map((s) => [s.key, s.value])
      ),
    };

    await api.post("/products", payload);
    toast.success("Product created successfully!");
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Add Product</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Fill in the details below</p>
        </div>
      </div>

      <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" />
    </div>
  );
}
