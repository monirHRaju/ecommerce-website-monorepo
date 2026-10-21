"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import type { ApiResponse, DashboardChartData } from "@/types";

export default function TopProducts() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard-chart-data"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardChartData>>("/dashboard/chart-data");
      return res.data.data;
    },
  });

  const products = chartData?.topProducts ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Top Products
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">By units sold</p>
        </div>
        <Link
          href="/products"
          className="text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No products yet</p>
      ) : (
        <ol className="space-y-4">
          {products.map((p, i) => (
            <li key={p._id} className="flex items-center gap-3">
              {/* rank */}
              <span className="w-5 text-sm font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                {i + 1}
              </span>
              {/* thumbnail */}
              {p.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-gray-700 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#9CA3AF" strokeWidth="1.5"/>
                  </svg>
                </div>
              )}
              {/* info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {p.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-xs text-gray-400">{p.rating.toFixed(1)}</span>
                </div>
              </div>
              {/* sold */}
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                {p.sold.toLocaleString()} sold
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
