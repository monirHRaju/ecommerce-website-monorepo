"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Star, UserCircle2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "@/context/ToastContext";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Review } from "@/types";
import { cn } from "@/utils/cn";

interface Props {
  productId: string;
  rating?: number;
  reviewCount?: number;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              s <= (hover || value) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-stone-500 font-medium">{star}</span>
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-stone-400 text-[11px]">{pct}%</span>
    </div>
  );
}

// ─── AI Summary Card ──────────────────────────────────────────────────────────
function AISummaryCard({ summary, onClose }: { summary: string; onClose: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-white"
        aria-label="Close summary"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-xs font-bold text-stone-900">AI Verified Summary</p>
          <p className="text-[10px] text-stone-500">Concierge Synthesis</p>
        </div>
      </div>

      <p className="text-xs text-stone-700 leading-relaxed">{summary}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReviewSection({
  productId,
  rating: initialRating,
  reviewCount: initialReviewCount,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await api.get(`/reviews/product/${productId}`);
      return res.data.data;
    },
  });

  const effectiveRating =
    initialRating !== undefined
      ? initialRating
      : reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 5;

  const effectiveCount =
    initialReviewCount !== undefined ? initialReviewCount : reviews.length;

  const { mutate: addReview, isPending } = useMutation({
    mutationFn: () => api.post("/reviews", { productId, rating: newRating, comment }),
    onSuccess: () => {
      toast.success("Review submitted! Thank you for sharing.");
      setNewRating(0);
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to submit review"),
  });

  const { mutate: generateSummary, isPending: summaryLoading } = useMutation({
    mutationFn: () => api.post("/ai/summarize-reviews", { productId }),
    onSuccess: (res) => setAiSummary(res.data.data.summary),
    onError: (err: any) => {
      const msg =
        err?.response?.data?.debug ||
        err?.response?.data?.message ||
        "Could not generate summary. Please try again.";
      toast.error(msg);
    },
  });

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const alreadyReviewed =
    user &&
    reviews.some(
      (r) => (typeof r.userId === "object" ? (r.userId as any)._id : r.userId) === user._id
    );

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Client Feedback & Reviews
        </h2>
      </div>

      {/* Rating summary + AI button */}
      <div className="flex flex-col sm:flex-row gap-8 items-start bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        {/* Overall score */}
        <div className="text-center shrink-0 w-full sm:w-44 border-b sm:border-b-0 sm:border-r border-stone-200 pb-6 sm:pb-0 sm:pr-6">
          <p className="font-serif text-5xl font-bold text-stone-900">
            {effectiveRating.toFixed(1)}
          </p>
          <div className="flex justify-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-4 h-4",
                  s <= Math.round(effectiveRating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-stone-200 text-stone-200"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-stone-500 font-light">{effectiveCount} verified reviews</p>

          {/* AI Summary button */}
          <button
            type="button"
            onClick={() => {
              if (aiSummary) {
                setAiSummary(null);
                return;
              }
              generateSummary();
            }}
            disabled={summaryLoading || reviews.length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mt-3 transition-all",
              aiSummary
                ? "bg-stone-100 text-stone-700 border border-stone-300"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
            )}
          >
            {summaryLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-amber-900/40 border-t-amber-900 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            )}
            <span>{summaryLoading ? "Analyzing…" : aiSummary ? "Hide Summary" : "AI Review Insights"}</span>
          </button>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 w-full space-y-1.5">
          {dist.map(({ star, count }) => (
            <RatingBar key={star} star={star} count={count} total={effectiveCount} />
          ))}
        </div>
      </div>

      {/* AI Summary card */}
      {aiSummary && (
        <AISummaryCard summary={aiSummary} onClose={() => setAiSummary(null)} />
      )}

      {/* Add review form */}
      {user && !alreadyReviewed && (
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-semibold text-sm text-stone-900">Share Your Experience</h3>
          <StarPicker value={newRating} onChange={setNewRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on the fabric quality, sizing accuracy, and drape…"
            rows={3}
            className="w-full rounded-xl border border-stone-300 p-3 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/50 resize-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!newRating) return toast.error("Please select a rating");
              if (!comment.trim()) return toast.error("Please write a comment");
              addReview();
            }}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            {isPending && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>Submit Review</span>
          </button>
        </div>
      )}

      {alreadyReviewed && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          Thank you! You have already shared a review for this piece.
        </div>
      )}

      {!user && (
        <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600">
          <span>
            Please{" "}
            <a href="/login" className="text-stone-900 font-bold underline">
              sign in
            </a>{" "}
            to share your review for this garment.
          </span>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 p-4 bg-white rounded-xl border border-stone-200">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-stone-200" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-24 bg-stone-200 rounded" />
                  <div className="h-3 w-16 bg-stone-200 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-stone-200 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-stone-400 text-xs italic py-4">
          No reviews yet. Be the first to share your experience with this garment.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const author = typeof r.userId === "object" ? r.userId : null;
            return (
              <div key={r._id} className="p-5 rounded-xl bg-white border border-stone-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500">
                      <UserCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-stone-900">
                        {author?.name || "Verified Customer"}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3.5 h-3.5",
                          s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pt-1">{r.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
