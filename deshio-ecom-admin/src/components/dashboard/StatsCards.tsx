"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, DashboardStats } from "@/types";
import { GroupIcon, BoxIconLine, DollarLineIcon, DocsIcon } from "@/icons";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toFixed(2)}`;
}

function fmtCount(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="mt-5 space-y-2">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// ─── card ────────────────────────────────────────────────────────────────────

interface CardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string; // bg class for icon container
}

function StatCard({ label, value, icon, color }: CardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}
      >
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {value}
        </h4>
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const cards: CardProps[] = [
    {
      label: "Total Revenue",
      value: fmt(data?.totalRevenue ?? 0),
      icon: <DollarLineIcon className="text-emerald-600 size-6" />,
      color: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Total Orders",
      value: fmtCount(data?.totalOrders ?? 0),
      icon: <DocsIcon className="text-brand-600 size-6" />,
      color: "bg-brand-50 dark:bg-brand-500/10",
    },
    {
      label: "Total Products",
      value: fmtCount(data?.totalProducts ?? 0),
      icon: <BoxIconLine className="text-orange-500 size-6" />,
      color: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      label: "Total Users",
      value: fmtCount(data?.totalUsers ?? 0),
      icon: <GroupIcon className="text-purple-500 size-6" />,
      color: "bg-purple-50 dark:bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
