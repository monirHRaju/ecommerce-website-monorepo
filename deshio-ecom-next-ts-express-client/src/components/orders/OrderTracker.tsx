"use client";

import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/formatPrice";
import {
  CheckCircle2,
  Clock,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackingData {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  deliveryCharge?: number;
  couponDiscount?: number;
  orderNote?: string;
  deliveryZone?: { name: string; estimatedDays: string } | null;
  items: {
    title: string;
    quantity: number;
    image?: string;
    price: number;
    size?: string;
    color?: string;
    sku?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: "pending",    label: "Order Placed", icon: Clock,        description: "Your order has been received" },
  { key: "processing", label: "Processing",   icon: Package,      description: "We're preparing your garment" },
  { key: "shipped",    label: "Shipped",       icon: Truck,        description: "Package is on the way" },
  { key: "delivered",  label: "Delivered",     icon: PackageCheck, description: "Package delivered successfully" },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

// ─── Timeline events derived from status ─────────────────────────────────────

function buildTimeline(status: string, createdAt: string, updatedAt: string) {
  const idx = STATUS_ORDER[status] ?? -1;
  const events: { label: string; sub: string; date: string; active: boolean }[] = [];

  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (idx >= 0)
    events.push({
      label: "Order Placed",
      sub: "Your order was received and confirmed.",
      date: fmt(createdAt),
      active: true,
    });
  if (idx >= 1)
    events.push({
      label: "Processing",
      sub: "Atelier is packing and quality inspecting your garments.",
      date: fmt(updatedAt),
      active: true,
    });
  if (idx >= 2)
    events.push({
      label: "Shipped",
      sub: "Handed over to courier partner for express delivery.",
      date: fmt(updatedAt),
      active: true,
    });
  if (idx >= 3)
    events.push({
      label: "Delivered",
      sub: "Package delivered to your doorstep.",
      date: fmt(updatedAt),
      active: true,
    });

  return events.reverse();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderTracker({ data }: { data: TrackingData }) {
  const isCancelled = data.orderStatus === "cancelled";
  const currentStep = STATUS_ORDER[data.orderStatus] ?? 0;
  const timeline = buildTimeline(data.orderStatus, data.createdAt, data.updatedAt);

  return (
    <div className="space-y-6">
      {/* ── Header Card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-stone-500 uppercase tracking-widest mb-1">
              Order Reference
            </p>
            <p className="font-bold text-lg font-mono text-stone-900">
              {data.orderNumber}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Placed on{" "}
              {new Date(data.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5" /> Cancelled
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  data.orderStatus === "delivered"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-900 border border-amber-200"
                }`}
              >
                {data.orderStatus}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                data.paymentStatus === "paid"
                  ? "bg-emerald-50 text-emerald-700"
                  : data.paymentStatus === "failed"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              Payment: {data.paymentStatus}
            </span>
          </div>
        </div>

        {/* Delivery zone info */}
        {data.deliveryZone && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>
              Delivery Option:{" "}
              <strong className="text-stone-900">{data.deliveryZone.name}</strong>
            </span>
            <span>Est. Arrival: {data.deliveryZone.estimatedDays}</span>
          </div>
        )}
      </div>

      {/* ── Progress Stepper ─────────────────────────────────────────────── */}
      {!isCancelled && (
        <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-6">
          <h3 className="font-serif font-bold text-sm text-stone-900 mb-6">
            Dispatch Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isDone = currentStep >= idx;
              const isCurrent = currentStep === idx;
              return (
                <div
                  key={s.key}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? "border-stone-900 bg-stone-50 shadow-xs"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-stone-200 opacity-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 text-xs ${
                      isDone
                        ? "bg-stone-900 text-white"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-xs text-stone-900">{s.label}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order Items ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs p-6">
        <h3 className="font-serif font-bold text-sm text-stone-900 mb-4">
          Garments Ordered
        </h3>
        <ul className="divide-y divide-stone-100">
          {data.items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0">
                <Image
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&q=80"
                  }
                  alt={item.title}
                  fill
                  className="object-cover object-top"
                  sizes="48px"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-stone-900 line-clamp-1">
                  {item.title}
                </p>
                {(item.size || item.color) && (
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && " • "}
                    {item.color && item.color}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Summary Breakdown */}
        <div className="border-t border-stone-100 mt-4 pt-4 space-y-2 text-xs sm:text-sm">
          {(data.deliveryCharge ?? 0) > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Delivery Charge</span>
              <span className="font-medium text-stone-900">
                {formatPrice(data.deliveryCharge!)}
              </span>
            </div>
          )}
          {(data.couponDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon Discount</span>
              <span>−{formatPrice(data.couponDiscount!)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm sm:text-base pt-1">
            <span>Total</span>
            <span className="font-serif font-bold text-lg text-stone-900">
              {formatPrice(data.totalAmount)}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 capitalize pt-1">
            Payment: {data.paymentMethod.replace(/_/g, " ")} • {data.paymentStatus}
          </p>
        </div>

        {data.orderNote && (
          <div className="mt-4 p-3 rounded-xl bg-stone-50 text-xs text-stone-600 border border-stone-200">
            <span className="font-medium text-stone-900">Customer Note: </span>
            {data.orderNote}
          </div>
        )}
      </div>
    </div>
  );
}
