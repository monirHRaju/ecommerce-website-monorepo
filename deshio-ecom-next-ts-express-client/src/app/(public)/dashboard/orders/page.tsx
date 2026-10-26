"use client";

import OrderTracker, { TrackingData } from "@/components/orders/OrderTracker";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { formatPrice } from "@/utils/formatPrice";
import { Order } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Package, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const { data: trackingData, isLoading: loadingTrack } = useQuery<TrackingData>({
    queryKey: ["order-track", order._id],
    queryFn: async () => {
      const res = await api.get(`/orders/track/${order.orderNumber}`);
      return res.data.data;
    },
    enabled: expanded,
    staleTime: 30_000,
  });

  return (
    <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Summary row */}
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-sm font-mono text-stone-900">
              {order.orderNumber}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              {" • "}
              {order.items.length} {order.items.length === 1 ? "garment" : "garments"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                order.orderStatus === "delivered"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : order.orderStatus === "cancelled"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              {order.orderStatus}
            </span>
            <span className="font-bold text-stone-900 text-sm">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Item preview with variant tags */}
        <div className="mt-3 space-y-1">
          {order.items.slice(0, 3).map((item, i) => (
            <p key={i} className="text-xs text-stone-600 line-clamp-1">
              <span className="font-medium text-stone-900">{item.title}</span>
              {(item.size || item.color) && (
                <span className="text-stone-400 ml-1">
                  [{[item.size, item.color].filter(Boolean).join(", ")}]
                </span>
              )}
              <span className="text-stone-400 ml-1">× {item.quantity}</span>
            </p>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-stone-400">+{order.items.length - 3} more</p>
          )}
        </div>

        {/* Track toggle button */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-stone-800 hover:text-amber-800 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{expanded ? "Hide Dispatch Details" : "Track Shipment"}</span>
        </button>
      </div>

      {/* Expandable tracking panel */}
      {expanded && (
        <div className="border-t border-stone-200 bg-stone-50/60 p-5">
          {loadingTrack ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-stone-200/70 animate-pulse" />
              ))}
            </div>
          ) : trackingData ? (
            <OrderTracker data={trackingData} />
          ) : (
            <p className="text-xs text-stone-500 text-center py-4">
              Could not load shipment details. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await api.get("/orders", { params: { limit: 50 } });
      return res.data.data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-stone-200/80 animate-pulse" />
        ))}
      </div>
    );
  }

  const orders = data ?? [];

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
          <Package className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">No Orders Placed Yet</h2>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto font-light">
            Once you place an order, you can monitor its dispatch progress, estimated arrival, and garment details here.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs text-stone-500">
          Showing <span className="font-semibold text-stone-900">{orders.length}</span> orders
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}
