"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import type { ApiResponse, Order, User } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "info"> = {
  delivered: "success",
  processing: "info",
  shipped: "info",
  pending: "warning",
  cancelled: "error",
  refunded: "error",
};

const PAYMENT_COLOR: Record<string, "success" | "warning" | "error"> = {
  paid: "success",
  pending: "warning",
  failed: "error",
  refunded: "error",
};

function avatar(user: User) {
  return user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatar}
      alt={user.name}
      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
    />
  ) : (
    <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
      {user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)}
    </span>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableCell key={i} className="py-3">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function RecentOrdersTable() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order[]>>("/dashboard/recent-orders");
      return res.data.data;
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* header */}
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Orders
        </h3>
        <Link
          href="/orders"
          className="text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          View all orders →
        </Link>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {["Order #", "Customer", "Amount", "Payment", "Status", "Date"].map(
                (h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading
              ? [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
              : (orders ?? []).map((order) => {
                  const user =
                    typeof order.userId === "object" ? (order.userId as User) : null;
                  return (
                    <TableRow key={order._id}>
                      {/* order number */}
                      <TableCell className="py-3">
                        <span className="font-mono text-xs font-medium text-gray-800 dark:text-white/80">
                          {order.orderNumber}
                        </span>
                      </TableCell>

                      {/* customer */}
                      <TableCell className="py-3">
                        {user ? (
                          <div className="flex items-center gap-2">
                            {avatar(user)}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* amount */}
                      <TableCell className="py-3">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          ৳{order.totalAmount.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* payment status */}
                      <TableCell className="py-3">
                        <Badge size="sm" color={PAYMENT_COLOR[order.paymentStatus] ?? "warning"}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>

                      {/* order status */}
                      <TableCell className="py-3">
                        <Badge size="sm" color={STATUS_COLOR[order.orderStatus] ?? "warning"}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>

                      {/* date */}
                      <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>

        {!isLoading && (orders ?? []).length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No orders yet</p>
        )}
      </div>
    </div>
  );
}
