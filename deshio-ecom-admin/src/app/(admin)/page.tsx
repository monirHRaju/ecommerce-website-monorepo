import type { Metadata } from "next";
import StatsCards from "@/components/dashboard/StatsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import MonthlyOrdersChart from "@/components/dashboard/MonthlyOrdersChart";
import TopProducts from "@/components/dashboard/TopProducts";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";

export const metadata: Metadata = {
  title: "Dashboard | Deshio Admin",
  description: "Deshio e-commerce admin overview",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back — here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Row 1 — stat cards */}
      <StatsCards />

      {/* Row 2 — revenue chart + order status donut */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <OrderStatusChart />
        </div>
      </div>

      {/* Row 3 — monthly orders bar + top products */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <MonthlyOrdersChart />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <TopProducts />
        </div>
      </div>

      {/* Row 4 — recent orders table */}
      <RecentOrdersTable />
    </div>
  );
}
