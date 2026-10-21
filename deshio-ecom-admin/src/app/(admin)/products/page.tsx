"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Product, Category, ApiResponse } from "@/types";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";

// ─── helpers ─────────────────────────────────────────────────────────────────

function stockColor(stock: number): "success" | "warning" | "error" {
  if (stock === 0) return "error";
  if (stock <= 5) return "warning";
  return "success";
}

function discountedPrice(price: number, discount: number) {
  return discount > 0 ? price * (1 - discount / 100) : price;
}

// ─── skeleton row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <TableCell key={i} className="py-3">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  // Debounce search input — wait 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 10;

  // ── products query ──
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
        sort,
        ...(search ? { search } : {}),
      });
      const res = await api.get<ApiResponse<Product[]> & { meta: { total: number; totalPages: number } }>(
        `/products?${params}`
      );
      return res.data;
    },
  });

  const products = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  // ── delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete product"),
  });

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Products</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your product catalogue
          </p>
        </div>
        <Link
          href="/products/create"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search products…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
        />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-sold">Most sold</option>
          <option value="price">Price: low → high</option>
          <option value="-price">Price: high → low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Product", "Category", "Price", "Stock", "Rating", "Sold", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : products.map((p) => {
                    const cat = typeof p.category === "object" ? (p.category as Category) : null;
                    const finalPrice = discountedPrice(p.price, p.discount);

                    return (
                      <TableRow key={p._id}>
                        {/* product */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[180px]">
                                {p.title}
                              </p>
                              {p.isFeatured && (
                                <Badge size="sm" color="info">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* category */}
                        <TableCell className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {cat?.name ?? "—"}
                        </TableCell>

                        {/* price */}
                        <TableCell className="py-3 px-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            ৳{finalPrice.toFixed(2)}
                          </span>
                          {p.discount > 0 && (
                            <span className="ml-1.5 text-xs text-gray-400 line-through">
                              ৳{p.price.toFixed(2)}
                            </span>
                          )}
                        </TableCell>

                        {/* stock */}
                        <TableCell className="py-3 px-4">
                          <Badge size="sm" color={stockColor(p.stock)}>
                            {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                          </Badge>
                        </TableCell>

                        {/* rating */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {p.rating.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>

                        {/* sold */}
                        <TableCell className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {p.sold.toLocaleString()}
                        </TableCell>

                        {/* actions */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/products/${p._id}/edit`}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteId(p._id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {!isLoading && products.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No products found.</p>
              <Link href="/products/create" className="mt-2 inline-block text-sm text-brand-500 hover:underline">
                Add your first product →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Delete Product?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
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
