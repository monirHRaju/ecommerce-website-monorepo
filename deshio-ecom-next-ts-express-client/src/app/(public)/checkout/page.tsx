"use client";

import { CartItem, useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import EditOptionModal from "@/components/cart/EditOptionModal";
import api from "@/lib/axios";
import { formatPrice } from "@/utils/formatPrice";
import { AppliedCoupon, DeliveryZone, PaymentMethod } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  KeyRound,
  Lock,
  LogIn,
  MapPin,
  Package,
  ShoppingBag,
  Smartphone,
  SquarePen,
  Tag,
  Trash2,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/context/ToastContext";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;

const schema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    phone: z
      .string()
      .trim()
      .refine((val) => bdPhoneRegex.test(val.replace(/[\s\-()]/g, "")), {
        message: "Enter a valid 11-digit BD mobile number (e.g. 017XXXXXXXX)",
      }),
    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Enter a valid email address"
      ),
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    country: z.string().min(2, "Country is required"),
    zip: z.string().optional(),
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
    {
      message: "Please select a mobile banking provider",
      path: ["selectedPaymentMethodId"],
    }
  )
  .refine(
    (d) =>
      d.paymentMethod !== "mobile_banking" ||
      (d.mobileLast4 && /^\d{4}$/.test(d.mobileLast4)),
    {
      message: "Enter the last 4 digits of your account number",
      path: ["mobileLast4"],
    }
  )
  .refine(
    (d) =>
      d.paymentMethod !== "mobile_banking" ||
      (d.transactionId && d.transactionId.trim().length > 0),
    { message: "Transaction ID is required", path: ["transactionId"] }
  );

type FormValues = z.infer<typeof schema>;

interface OrderSuccessState {
  orderNumber: string;
  accountCreated?: boolean;
  existingAccount?: boolean;
  loginIdentifier?: string;
  generatedPassword?: string;
  emailSentTo?: string;
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ result }: { result: OrderSuccessState }) {
  const [copiedField, setCopiedField] = useState<"phone" | "password" | null>(
    null
  );

  const copyText = (text: string, field: "phone" | "password") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === "password" ? "Password" : "Login ID"} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Order Confirmed!
        </h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto font-light">
          Thank you for your order! Your garments are being prepared for
          dispatch.
        </p>
        <p className="mt-3 text-xs font-mono bg-stone-100 text-stone-800 inline-block px-4 py-2 rounded-xl border border-stone-200">
          Order Reference: #{result.orderNumber}
        </p>
      </div>

      {/* Auto-Created Account Credentials Card */}
      {result.accountCreated && result.generatedPassword && (
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-left space-y-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Your Account is Ready
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <UserCheck className="w-3 h-3" /> Auto Logged In
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                We created an account for you and sent your login details via
                SMS
                {result.emailSentTo ? ` and email (${result.emailSentTo})` : ""}.
                Save your password below:
              </p>
            </div>
          </div>

          <div className="space-y-2.5 bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  Login Mobile Number
                </p>
                <p className="font-mono text-sm font-bold text-stone-900">
                  {result.loginIdentifier}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(result.loginIdentifier || "", "phone")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {copiedField === "phone" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-stone-100 pt-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  Temporary Password
                </p>
                <p className="font-mono text-lg font-extrabold tracking-widest text-amber-900">
                  {result.generatedPassword}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(result.generatedPassword || "", "password")
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
              >
                {copiedField === "password" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-stone-500">
            You can change this password anytime in{" "}
            <Link
              href="/dashboard/profile"
              className="font-semibold text-stone-800 underline"
            >
              My Profile
            </Link>
            .
          </p>
        </div>
      )}

      {/* Existing Account Notice */}
      {result.existingAccount && (
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 text-left space-y-2 shadow-xs">
          <p className="text-xs font-semibold text-stone-900">
            Linked to your existing account ({result.loginIdentifier})
          </p>
          <p className="text-xs text-stone-500">
            This order has been added to your account. Sign in with your
            existing password to view all your orders in your dashboard.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {result.existingAccount ? (
          <>
            <Link
              href={`/track-order`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Package className="w-4 h-4" />
              <span>Track Order</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
            </Link>
          </>
        ) : (
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>View & Track Order</span>
          </Link>
        )}
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
  const { user, login } = useAuth();
  const { items, totalItems, totalPrice, removeItem, clearCart } = useCart();
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessState | null>(
    null
  );
  const [placing, setPlacing] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null
  );
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
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email:
        user?.email && !user.email.endsWith("@guest.local") ? user.email : "",
      street: user?.address?.street ?? "",
      city: user?.address?.city ?? "",
      country: user?.address?.country ?? "Bangladesh",
      zip: user?.address?.zip ?? "",
      paymentMethod: "cash_on_delivery",
      deliveryZoneId: "",
      orderNote: "",
      selectedPaymentMethodId: "",
      mobileLast4: "",
      transactionId: "",
    },
  });

  // Sync user profile defaults when user loads
  useEffect(() => {
    if (!user) return;
    if (user.name && !watch("name")) setValue("name", user.name);
    if (user.phone && !watch("phone")) setValue("phone", user.phone);
    if (
      user.email &&
      !user.email.endsWith("@guest.local") &&
      !watch("email")
    ) {
      setValue("email", user.email);
    }
    if (user.address?.street && !watch("street"))
      setValue("street", user.address.street);
    if (user.address?.city && !watch("city"))
      setValue("city", user.address.city);
    if (user.address?.zip && !watch("zip")) setValue("zip", user.address.zip);
  }, [user, setValue, watch]);

  // Auto-select first delivery zone when zones are fetched
  useEffect(() => {
    if (deliveryZones.length > 0 && !watch("deliveryZoneId")) {
      setValue("deliveryZoneId", deliveryZones[0]._id);
    }
  }, [deliveryZones, setValue, watch]);

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedMobileMethodId = watch("selectedPaymentMethodId");
  const selectedMobileMethod = mobileMethods.find(
    (m) => m._id === selectedMobileMethodId
  );

  const selectedZoneId = watch("deliveryZoneId");
  const selectedZone = deliveryZones.find((z) => z._id === selectedZoneId);
  const deliveryCharge = selectedZone?.charge ?? 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const grandTotal = Math.max(0, totalPrice + deliveryCharge - couponDiscount);

  if (orderSuccess) return <OrderSuccess result={orderSuccess} />;

  if (items.length === 0) {
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

  // ── Submit (Logged-in OR Guest Auto-Account Checkout) ──────────────────────
  const onSubmit = async (data: FormValues) => {
    setPlacing(true);
    try {
      const shippingAddress = {
        street: data.street,
        city: data.city,
        country: data.country,
        zip: data.zip || "",
      };

      const mobilePayment =
        data.paymentMethod === "mobile_banking"
          ? {
              paymentMethodId: data.selectedPaymentMethodId,
              mobileLast4: data.mobileLast4,
              transactionId: data.transactionId,
            }
          : undefined;

      const serializedItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        sku: i.sku,
      }));

      if (user) {
        const res = await api.post("/orders", {
          shippingAddress,
          phone: data.phone,
          paymentMethod: data.paymentMethod,
          deliveryZoneId: data.deliveryZoneId,
          couponCode: appliedCoupon?.code,
          orderNote: data.orderNote || undefined,
          mobilePayment,
          items: serializedItems,
        });
        clearCart();
        setOrderSuccess({
          orderNumber: res.data.data.orderNumber,
        });
        toast.success("Order placed successfully!");
      } else {
        const res = await api.post("/orders/guest-checkout", {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          shippingAddress,
          items: serializedItems,
          paymentMethod: data.paymentMethod,
          deliveryZoneId: data.deliveryZoneId,
          couponCode: appliedCoupon?.code,
          orderNote: data.orderNote || undefined,
          mobilePayment,
        });

        const result = res.data.data;

        // Clear guest localStorage cart BEFORE calling login() so syncGuestToApi doesn't re-add ordered items
        clearCart();

        if (
          result.accountCreated &&
          result.accessToken &&
          result.refreshToken &&
          result.user
        ) {
          login(result.accessToken, result.refreshToken, result.user);
        }

        setOrderSuccess({
          orderNumber: result.order.orderNumber,
          accountCreated: result.accountCreated,
          existingAccount: result.existingAccount,
          loginIdentifier: result.loginIdentifier,
          generatedPassword: result.generatedPassword,
          emailSentTo: data.email || undefined,
        });
        toast.success("Order placed successfully!");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to place order. Please try again."
      );
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

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Checkout
          </h1>
          {!user && (
            <p className="text-xs text-stone-500">
              Already have an account?{" "}
              <Link
                href="/login?redirect=/checkout"
                className="font-semibold text-stone-900 underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* ── Left Details ────────────────────────────────────────────── */}
            <div className="space-y-6">
              {/* 1. Customer & Shipping Address */}
              <section className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Customer & Delivery Details
                  </h2>
                </div>

                {!user && (
                  <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 px-3.5 py-2.5 text-xs text-amber-950">
                    No signup required — place your order and we&apos;ll
                    automatically create your account and send your login
                    password via SMS.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        {...register("name")}
                        placeholder="Your full name"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.name ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.name && (
                        <p className="text-rose-600 text-xs mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Mobile Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        placeholder="017XXXXXXXX"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.phone ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-rose-600 text-xs mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email Address{" "}
                      <span className="text-stone-400 font-normal">
                        (optional — for email receipt & credentials)
                      </span>
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                        errors.email ? "border-rose-400" : "border-stone-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-rose-600 text-xs mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Street / Full Address{" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      {...register("street")}
                      placeholder="House 12, Road 5, Dhanmondi"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                        errors.street ? "border-rose-400" : "border-stone-300"
                      }`}
                    />
                    {errors.street && (
                      <p className="text-rose-600 text-xs mt-1">
                        {errors.street.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        City / District <span className="text-rose-600">*</span>
                      </label>
                      <input
                        {...register("city")}
                        placeholder="Dhaka"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40 ${
                          errors.city ? "border-rose-400" : "border-stone-300"
                        }`}
                      />
                      {errors.city && (
                        <p className="text-rose-600 text-xs mt-1">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ZIP / Postal Code{" "}
                        <span className="text-stone-400 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        {...register("zip")}
                        placeholder="1205"
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40"
                      />
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
                        <p className="text-rose-600 text-xs mt-1">
                          {errors.country.message}
                        </p>
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
                  <p className="text-rose-600 text-xs">
                    {errors.deliveryZoneId.message}
                  </p>
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
                          e.key === "Enter" &&
                          (e.preventDefault(), handleApplyCoupon())
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
                          setValue(
                            "paymentMethod",
                            e.target.value as FormValues["paymentMethod"]
                          );
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
                  <p className="text-rose-600 text-xs">
                    {errors.paymentMethod.message}
                  </p>
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
                            errors.mobileLast4
                              ? "border-rose-400"
                              : "border-stone-300"
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
                            errors.transactionId
                              ? "border-rose-400"
                              : "border-stone-300"
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
                  Order Note{" "}
                  <span className="text-stone-400 font-normal text-xs">
                    (optional)
                  </span>
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
                <span>
                  Your customer details are encrypted and securely handled
                </span>
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

                {/* Items list with variant details & Edit Option trigger */}
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-stone-100">
                  {items.map((item) => (
                    <li
                      key={item._id}
                      className="pt-3 first:pt-0 flex gap-3 items-start"
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
                        <p className="text-xs sm:text-sm font-medium text-stone-900 line-clamp-2">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500 flex-wrap">
                          <span className="uppercase tracking-wide font-medium">
                            {[item.color, item.size]
                              .filter(Boolean)
                              .join(" / ") || "Standard"}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            title="Edit size, color or quantity"
                            className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-medium transition-colors"
                          >
                            <SquarePen className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-stone-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item._id).catch(() =>
                              toast.error("Failed to remove item")
                            )
                          }
                          aria-label="Remove item"
                          className="text-stone-400 hover:text-rose-600 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-stone-200 pt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-stone-900">
                      {formatPrice(totalPrice)}
                    </span>
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
                        <span className="text-stone-400 italic text-xs">
                          select option
                        </span>
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
                  <span className="font-semibold text-stone-900 text-sm">
                    Total
                  </span>
                  <span className="font-serif font-bold text-2xl text-stone-900">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={placing}
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

      {/* Edit Option Modal */}
      <EditOptionModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}
