"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Order, OrderStatus, PaymentStatus, ApiResponse, User } from "@/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

function orderStatusStyle(s: OrderStatus) {
  switch (s) {
    case "pending":    return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    case "processing": return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    case "shipped":    return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    case "delivered":  return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "cancelled":  return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }
}

function paymentStatusStyle(s: PaymentStatus) {
  switch (s) {
    case "pending": return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    case "paid":    return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "failed":  return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }
}

function getUser(order: Order): User | null {
  if (order.userId && typeof order.userId === "object") return order.userId as User;
  return null;
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

// ─── order details modal ──────────────────────────────────────────────────────

function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (id: string, patch: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus }) => void;
}) {
  const user = getUser(order);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onStatusUpdate(order._id, {
        orderStatus: orderStatus !== order.orderStatus ? orderStatus : undefined,
        paymentStatus: paymentStatus !== order.paymentStatus ? paymentStatus : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const changed = orderStatus !== order.orderStatus || paymentStatus !== order.paymentStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {order.orderNumber}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* customer + shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Customer</p>
              {user ? (
                <>
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Unknown</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
              {order.shippingAddress ? (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                  {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                  {(order.shippingAddress.city || order.shippingAddress.zip) && (
                    <p>{[order.shippingAddress.city, order.shippingAddress.zip].filter(Boolean).join(", ")}</p>
                  )}
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                  {order.phone && <p className="mt-1 font-medium">Phone: {order.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
            </div>
          </div>

          {/* items table */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Items ({order.items.length})
            </p>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {item.image && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-8 h-8 rounded object-cover shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">৳{item.price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800 dark:text-white">৳{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* payment summary */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-1.5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Payment Summary</p>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Payment method</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            {order.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery charge</span>
                <span>৳{order.deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Coupon discount {order.couponCode && `(${order.couponCode})`}</span>
                <span>-৳{order.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-gray-800 dark:text-white pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span>Total</span>
              <span>৳{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {order.orderNote && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Order Note</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.orderNote}</p>
            </div>
          )}

          {/* Mobile payment details */}
          {order.mobilePayment?.transactionId && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Mobile Payment Details
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Method</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {order.mobilePayment.paymentMethodName || "Mobile Banking"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mobile (Last 4)</p>
                  <p className="font-medium text-gray-800 dark:text-white/90 font-mono">
                    ****{order.mobilePayment.mobileLast4}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">TrxID</p>
                  <p className="font-medium text-gray-800 dark:text-white/90 font-mono break-all">
                    {order.mobilePayment.transactionId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* status update */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Update Status</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  className="input-field"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="input-field"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={!changed || saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<{ data: Order[]; meta: { total: number; totalPages: number } }>(
        `/orders?${params}`
      );
      return res.data;
    },
  });

  const orders = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  // client-side search by order number or customer name/email
  const filtered = search.trim()
    ? orders.filter((o) => {
        const q = search.toLowerCase();
        const user = getUser(o);
        return (
          o.orderNumber?.toLowerCase().includes(q) ||
          user?.name?.toLowerCase().includes(q) ||
          user?.email?.toLowerCase().includes(q)
        );
      })
    : orders;

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus };
    }) => api.patch(`/orders/${id}/status`, patch),
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Failed to update order"),
  });

  function handleStatusUpdate(
    id: string,
    patch: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus }
  ) {
    return updateStatusMutation.mutateAsync({ id, patch });
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Orders</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.meta?.total ?? 0} order{data?.meta?.total !== 1 ? "s" : ""} total
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
            placeholder="Search order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`input-field transition-all ${search ? "pl-3" : "pl-10"}`}
          />
        </div>
      </div>

      {/* status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); setSearch(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
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
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
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
                : filtered.map((order) => {
                    const user = getUser(order);
                    return (
                      <tr
                        key={order._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          {user ? (
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[140px]">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[140px]">{user.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {order.items.length}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">
                          ৳{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${paymentStatusStyle(order.paymentStatus)}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${orderStatusStyle(order.orderStatus)}`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs font-medium text-brand-500 hover:text-brand-600 hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">
                    {search ? `No orders match "${search}"` : "No orders found."}
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

      {/* order details modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
