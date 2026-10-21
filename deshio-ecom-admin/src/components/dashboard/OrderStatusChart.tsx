"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ApexOptions } from "apexcharts";
import api from "@/lib/api";
import type { ApiResponse, DashboardChartData } from "@/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  processing: "#3B82F6",
  shipped: "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
  refunded: "#6B7280",
};

export default function OrderStatusChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard-chart-data"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardChartData>>("/dashboard/chart-data");
      return res.data.data;
    },
  });

  const statusData = chartData?.ordersByStatus ?? [];
  const labels = statusData.map((d) => d._id.charAt(0).toUpperCase() + d._id.slice(1));
  const series = statusData.map((d) => d.count);
  const colors = statusData.map((d) => STATUS_COLORS[d._id] ?? "#9CA3AF");

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      toolbar: { show: false },
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
      fontSize: "13px",
      labels: { colors: "#6B7280" },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              fontFamily: "Outfit, sans-serif",
              color: "#6B7280",
              formatter: (w) =>
                String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v) => `${v} orders` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Orders by Status
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All-time distribution
        </p>
      </div>

      {isLoading ? (
        <div className="h-[260px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
      ) : series.length === 0 ? (
        <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">
          No order data yet
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      )}
    </div>
  );
}
