"use client";

import OrderTracker, { TrackingData } from "@/components/orders/OrderTracker";
import api from "@/lib/axios";
import { MapPin, Search } from "lucide-react";
import { FormEvent, useState } from "react";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setTracking(null);

    try {
      const res = await api.get(`/orders/track/${trimmed}`);
      setTracking(res.data.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Order not found. Please check your order number."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/30 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mb-4 shadow-xs">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Track Your Order
          </h1>
          <p className="text-stone-500 mt-2 text-xs sm:text-sm font-light">
            Enter your order reference number to see real-time dispatch and delivery updates.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="flex gap-2.5 mb-8">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-1234567890"
            className="flex-1 rounded-xl border border-stone-300 px-4 py-3 font-mono text-xs sm:text-sm uppercase tracking-wider focus:outline-stone-900 bg-white shadow-xs"
          />
          <button
            type="submit"
            disabled={loading || !orderNumber.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-40 transition-colors shadow-xs"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Track</span>
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* Tracking result */}
        {tracking && <OrderTracker data={tracking} />}

        {/* Empty hint */}
        {!tracking && !error && !loading && (
          <div className="text-center text-stone-400 text-xs mt-8 space-y-1 font-light">
            <p>Your order reference number was sent via SMS and email after confirmation.</p>
            <p>
              Format: <span className="font-mono text-stone-600 font-medium">ORD-XXXXXXXXXX</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
