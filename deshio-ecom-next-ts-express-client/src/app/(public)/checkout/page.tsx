"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { formatPrice } from "@/utils/formatPrice";
import { AppliedCoupon, DeliveryZone, PaymentMethod } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Lock,
  MapPin,
  Package,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  X,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/context/ToastContext";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    country: z.string().min(2, "Country is required"),
    zip: z.string().min(3, "ZIP / Postal code is required"),
    phone: z.string().min(11, "Enter a valid mobile number").max(15),
    deliveryZoneId: z.string().min(1, "Please select a delivery option"),
    paymentMethod: z.enum(["cash_on_delivery", "mobile_banking"] as const, {
      error: "Select a payment method",
    }),
    orderNote: z.string().max(300).optional(),
    // Mobile banking fields
    selectedPaymentMethodId: z.string().optional(),
    mobileLast4: z.string().optional(),
    transactionId: z.string().optional(),
  })
  .refine(
    (d) =>
      d.paymentMethod !== "mobile_banking" ||
      (d.selectedPaymentMethodId && d.selectedPaymentMethodId.length > 0),
    { message: "Please select a mobile banking provider", path: ["selectedPaymentMethodId"] }
  )
  .refine(
    (d) =>
      d.paymentMethod !== "mobile_banking" || (d.mobileLast4 && /^\d{4}$/.test(d.mobileLast4)),
    { message: "Enter the last 4 digits of your account number", path: ["mobileLast4"] }
  )
  .refine(
    (d) =>
      d.paymentMethod !== "mobile_banking" ||
      (d.transactionId && d.transactionId.trim().length > 0),
    { message: "Transaction ID is required", path: ["transactionId"] }
  );

type FormValues = z.infer<typeof schema>;

// ─── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Order Confirmed!
        </h1>
        <p className="text-stone-500 text-sm mt-2 max-w-sm font-light">
          Thank you for choosing Deshio. Your order has been placed and is being prepared for dispatch.
        </p>
        <p className="mt-4 text-xs font-mono bg-stone-100 text-stone-800 inline-block px-4 py-2 rounded-xl border border-stone-200">
          Order Reference: #{orderNumber}
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
        >
          <Package className="w-4 h-4" />
          <span>Track Order</span>
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors"
        >
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { data: mobileMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await api.get("/payment-methods");
      return res.data.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const res = await api.get("/delivery-zones");
      return res.data.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      street: user?.address?.street ?? "",
      city: user?.address?.city ?? "",
      country: user?.address?.country ?? "Bangladesh",
      zip: user?.address?.zip ?? "",
      phone: user?.phone ?? "",
      paymentMethod: "cash_on_delivery",
      deliveryZoneId: "",
      orderNote: "",
      selectedPaymentMethodId: "",
      mobileLast4: "",
      transactionId: "",
    },
  });

  // Auto-select first delivery zone when zones are fetched
  useEffect(() => {
    if (deliveryZones.length > 0 && !watch("deliveryZoneId")) {
      setValue("deliveryZoneId", deliveryZones[0]._id);
    }
  }, [deliveryZones, setValue, watch]);

  // Guards
  useEffect(() => {
    if (!user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [user, router]);

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedMobileMethodId = watch("selectedPaymentMethodId");
  const selectedMobileMethod = mobileMethods.find((m) => m._id === selectedMobileMethodId);

  const selectedZoneId = watch("deliveryZoneId");
  const selectedZone = deliveryZones.find((z) => z._id === selectedZoneId);
  const deliveryCharge = selectedZone?.charge ?? 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const grandTotal = Math.max(0, totalPrice + deliveryCharge - couponDiscount);

  if (!user) return null;
  if (items.length === 0 && !orderNumber) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShoppingBag className="w-14 h-14 text-stone-300" />
        <p className="text-stone-500 font-medium">Your shopping bag is empty</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }
  if (orderNumber) return <OrderSuccess orderNumber={orderNumber} />;

  // ── Coupon handlers ────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", {
        code: couponInput.trim(),
        orderTotal: totalPrice,
      });
      setAppliedCoupon(res.data.data);
      toast.success(res.data.message);
      setCouponInput("");
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    if (!user.isVerified) {
      toast.error("Please verify your email before placing an order.");
      return;
    }
    setPlacing(true);
    try {
      const payload: Record<string, unknown> = {
        shippingAddress: {
          street: data.street,
          city: data.city,
          country: data.country,
          zip: data.zip,
        },
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        deliveryZoneId: data.deliveryZoneId,
        couponCode: appliedCoupon?.code,
        orderNote: data.orderNote || undefined,
      };
      if (data.paymentMethod === "mobile_banking") {
        payload.mobilePayment = {
          paymentMethodId: data.selectedPaymentMethodId,
          mobileLast4: data.mobileLast4,
          transactionId: data.transactionId,
        };
      }
      const res = await api.post("/orders", payload);
      clearCart();
      setOrderNumber(res.data.data.orderNumber);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-stone-400">
          <Link href="/" className="hover:text-stone-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-stone-700 transition-colors">
            Bag
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-700 font-medium">Checkout</span>
        </nav>

        <h1 className="font-serif text-3xl font-bold text-stone-900">Checkout</h1>

        {!user.isVerified && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              Your email is not verified. You must verify it before placing an order.{" "}
              <Link href="/dashboard/profile" className="font-bold underline">
                Verify now
              </Link>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* ── Left Details ────────────────────────────────────────────── */}
            <div className="space-y-6">
              {/* 1. Shipping Address */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Shipping Address
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Street Address
                    </label>
                    <input
                      {...register("street")}
                      placeholder="House 12, Road 5, Dhanmondi"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                        errors.street ? "border-rose-400" : "border-stone-300"
                      }`}
                    />
                    {errors.street && (
                      <p className="text-rose-600 text-xs mt-1">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        City / District
                      </label>
                      <input
                        {...register("city")}
                        placeholder="Dhaka"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.city ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.city && (
                        <p className="text-rose-600 text-xs mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Country
                      </label>
                      <input
                        {...register("country")}
                        placeholder="Bangladesh"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.country ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.country && (
                        <p className="text-rose-600 text-xs mt-1">{errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ZIP / Postal Code
                      </label>
                      <input
                        {...register("zip")}
                        placeholder="1205"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.zip ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.zip && (
                        <p className="text-rose-600 text-xs mt-1">{errors.zip.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Mobile Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.phone ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-rose-600 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Dynamic Delivery Option */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Delivery Option
                  </h2>
                </div>

                {deliveryZones.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    Loading delivery options…
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {deliveryZones.map((zone) => (
                      <label
                        key={zone._id}
                        className="flex items-center gap-3.5 cursor-pointer p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 transition-colors has-[:checked]:border-stone-900 has-[:checked]:bg-stone-50"
                      >
                        <input
                          {...register("deliveryZoneId")}
                          type="radio"
                          value={zone._id}
                          className="w-4 h-4 text-stone-900 accent-stone-900"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-stone-900">
                            {zone.name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Est. delivery: {zone.estimatedDays}
                          </p>
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          {formatPrice(zone.charge)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.deliveryZoneId && (
                  <p className="text-rose-600 text-xs">{errors.deliveryZoneId.message}</p>
                )}
              </section>

              {/* 3. Coupon Code */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Coupon Code
                  </h2>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-800">
                        {appliedCoupon.code} —{" "}
                        {appliedCoupon.type === "percent"
                          ? `${appliedCoupon.value}% off`
                          : `৳${appliedCoupon.value} off`}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        You save {formatPrice(appliedCoupon.discount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponError("");
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())
                        }
                        placeholder="Enter coupon code"
                        className="flex-1 uppercase rounded-lg border border-stone-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/30"
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponInput.trim()}
                        className="px-5 py-2 rounded-lg border border-stone-900 text-stone-900 text-xs font-semibold hover:bg-stone-900 hover:text-white transition-colors"
                      >
                        {validatingCoupon ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-rose-600 text-xs">{couponError}</p>
                    )}
                  </div>
                )}
              </section>

              {/* 4. Payment Method */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      value: "cash_on_delivery",
                      label: "Cash on Delivery",
                      sub: "Pay in cash when your garment arrives at your doorstep",
                      icon: "💵",
                    },
                    {
                      value: "mobile_banking",
                      label: "Mobile Banking",
                      sub: "Instant transfer via bKash, Nagad, or Rocket",
                      icon: <Smartphone className="w-5 h-5 text-amber-800" />,
                    },
                  ].map(({ value, label, sub, icon }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3.5 cursor-pointer p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 transition-colors has-[:checked]:border-stone-900 has-[:checked]:bg-stone-50"
                    >
                      <input
                        {...register("paymentMethod")}
                        type="radio"
                        value={value}
                        className="w-4 h-4 text-stone-900 accent-stone-900"
                        onChange={(e) => {
                          setValue("paymentMethod", e.target.value as FormValues["paymentMethod"]);
                          if (e.target.value !== "mobile_banking") {
                            setValue("selectedPaymentMethodId", "");
                            setValue("mobileLast4", "");
                            setValue("transactionId", "");
                          }
                        }}
                      />
                      <span className="text-xl">{icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-stone-900">
                          {label}
                        </p>
                        <p className="text-[11px] text-stone-500">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.paymentMethod && (
                  <p className="text-rose-600 text-xs">{errors.paymentMethod.message}</p>
                )}

                {/* Mobile Banking Options */}
                {selectedPaymentMethod === "mobile_banking" && (
                  <div className="mt-4 space-y-4 rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Select Mobile Banking Provider
                      </label>
                      {mobileMethods.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">
                          No mobile banking accounts active
                        </p>
                      ) : (
                        <select
                          {...register("selectedPaymentMethodId")}
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-white ${
                            errors.selectedPaymentMethodId
                              ? "border-rose-400"
                              : "border-stone-300"
                          }`}
                        >
                          <option value="">Choose one…</option>
                          {mobileMethods.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.selectedPaymentMethodId && (
                        <p className="text-rose-600 text-xs mt-1">
                          {errors.selectedPaymentMethodId.message}
                        </p>
                      )}
                    </div>

                    {selectedMobileMethod && (
                      <div className="space-y-3 rounded-lg bg-white border border-stone-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                            {selectedMobileMethod.name}
                          </h3>
                          <span className="text-base font-bold text-stone-900">
                            {formatPrice(grandTotal)}
                          </span>
                        </div>

                        {selectedMobileMethod.phoneNumber && (
                          <p className="text-xs text-stone-700">
                            Send payment to:{" "}
                            <span className="font-bold font-mono text-amber-900">
                              {selectedMobileMethod.phoneNumber}
                            </span>
                          </p>
                        )}

                        {selectedMobileMethod.qrImage && (
                          <div className="flex justify-center py-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedMobileMethod.qrImage}
                              alt="Payment QR Code"
                              className="w-36 h-36 object-contain rounded-lg border border-stone-200"
                            />
                          </div>
                        )}

                        {selectedMobileMethod.instructions && (
                          <div className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                            {selectedMobileMethod.instructions}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Sender Account Last 4 Digits
                        </label>
                        <input
                          {...register("mobileLast4")}
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 3378"
                          className={`w-full rounded-lg border px-3.5 py-2 text-xs sm:text-sm focus:outline-stone-900 bg-white ${
                            errors.mobileLast4 ? "border-rose-400" : "border-stone-300"
                          }`}
                          onInput={(e) => {
                            const el = e.target as HTMLInputElement;
                            el.value = el.value.replace(/\D/g, "").slice(0, 4);
                          }}
                        />
                        {errors.mobileLast4 && (
                          <p className="text-rose-600 text-xs mt-1">
                            {errors.mobileLast4.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Transaction ID (TrxID)
                        </label>
                        <input
                          {...register("transactionId")}
                          type="text"
                          placeholder="e.g. TXN1234ABCD"
                          className={`w-full rounded-lg border px-3.5 py-2 text-xs sm:text-sm focus:outline-stone-900 bg-white ${
                            errors.transactionId ? "border-rose-400" : "border-stone-300"
                          }`}
                        />
                        {errors.transactionId && (
                          <p className="text-rose-600 text-xs mt-1">
                            {errors.transactionId.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 5. Order Note */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-3 shadow-xs">
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Order Note <span className="text-stone-400 font-normal text-xs">(optional)</span>
                </h2>
                <textarea
                  {...register("orderNote")}
                  rows={3}
                  placeholder="Special delivery instructions, preferred delivery timing, gate codes…"
                  className="w-full rounded-lg border border-stone-300 p-3 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/30 resize-none"
                  maxLength={300}
                />
              </section>

              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Lock className="w-4 h-4" />
                <span>Your customer details are encrypted and securely handled</span>
              </div>
            </div>

            {/* ── Right Order Summary ─────────────────────────────────────── */}
            <div>
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-5 shadow-xs sticky top-28">
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Order Summary
                  <span className="text-stone-400 font-normal text-xs ml-2">
                    ({totalItems} {totalItems === 1 ? "garment" : "garments"})
                  </span>
                </h2>

                {/* Items list with variant details */}
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-stone-100">
                  {items.map((item) => (
                    <li key={item._id} className="pt-3 first:pt-0 flex gap-3 items-start">
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
                        <p className="text-xs sm:text-sm font-medium text-stone-900 line-clamp-2">
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

                <div className="border-t border-stone-200 pt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-stone-900">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>
                      Delivery {selectedZone ? `(${selectedZone.name})` : ""}
                    </span>
                    <span>
                      {selectedZone ? (
                        <span className="font-medium text-stone-900">
                          {formatPrice(deliveryCharge)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-xs">select option</span>
                      )}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>−{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-stone-900 text-sm">Total</span>
                  <span className="font-serif font-bold text-2xl text-stone-900">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={placing || !user.isVerified}
                  className="w-full py-3.5 rounded-lg bg-stone-900 text-white font-semibold text-xs sm:text-sm hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {placing ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>{placing ? "Confirming Order…" : "Place Order"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
