"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Review, User, Product } from "@/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getUser(review: Review): User | null {
  return review.userId && typeof review.userId === "object"
    ? (review.userId as User)
    : null;
}

function getProduct(review: Review): Product | null {
  return review.productId && typeof review.productId === "object"
    ? (review.productId as Product)
    : null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400" : "text-gray-200 dark:text-gray-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

// ─── delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  review,
  onClose,
  onConfirm,
  isPending,
}: {
  review: Review;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const user = getUser(review);
  const product = getProduct(review);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Delete this review?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              By <span className="font-medium">{user?.name ?? "Unknown"}</span>
              {product && <> on <span className="font-medium">{product.title}</span></>}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This will recalculate the product&apos;s rating.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const RATING_TABS = [
  { label: "All", value: 0 },
  { label: "★ 5", value: 5 },
  { label: "★ 4", value: 4 },
  { label: "★ 3", value: 3 },
  { label: "★ 2", value: 2 },
  { label: "★ 1", value: 1 },
];

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", ratingFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (ratingFilter) params.set("rating", String(ratingFilter));
      const res = await api.get<{ data: Review[]; meta: { total: number; totalPages: number } }>(
        `/reviews?${params}`
      );
      return res.data;
    },
  });

  const reviews = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  // client-side search by reviewer name or product title
  const filtered = search.trim()
    ? reviews.filter((r) => {
        const q = search.toLowerCase();
        const user = getUser(r);
        const product = getProduct(r);
        return (
          user?.name?.toLowerCase().includes(q) ||
          product?.title?.toLowerCase().includes(q)
        );
      })
    : reviews;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete review"),
  });

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.meta?.total ?? 0} review{data?.meta?.total !== 1 ? "s" : ""} total
          </p>
        </div>
        {/* search */}
        <div className="relative w-full sm:w-72">
          {/* {!search && (
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          )} */}
          <input
            type="text"
            placeholder="Search reviewer or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`input-field transition-all ${search ? "pl-3" : "pl-10"}`}
          />
        </div>
      </div>

      {/* rating tabs */}
      <div className="flex gap-1 flex-wrap">
        {RATING_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setRatingFilter(tab.value); setPage(1); setSearch(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              ratingFilter === tab.value
                ? "bg-brand-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviewer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((review) => {
                    const user = getUser(review);
                    const product = getProduct(review);
                    const productImage = product?.images?.[0];

                    return (
                      <tr
                        key={review._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {productImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={productImage}
                                alt={product?.title ?? ""}
                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-gray-700"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[140px]">
                              {product?.title ?? "—"}
                            </span>
                          </div>
                        </td>

                        {/* reviewer */}
                        <td className="px-4 py-3">
                          {user ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={user.avatar ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user._id}`}
                                alt={user.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0 bg-gray-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user._id}`;
                                }}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                {user.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* rating */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-gray-400">{review.rating}/5</span>
                          </div>
                        </td>

                        {/* comment */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {review.comment}
                          </p>
                        </td>

                        {/* date */}
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* delete */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(review)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Delete review"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    {search
                      ? `No reviews match "${search}"`
                      : ratingFilter
                      ? `No ${ratingFilter}-star reviews found.`
                      : "No reviews yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          review={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
