"use client";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ApexOptions } from "apexcharts";
import api from "@/lib/api";
import type { ApiResponse, DashboardChartData } from "@/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildSeries(chartData: DashboardChartData | undefined) {
  if (!chartData) return [{ name: "Revenue ($)", data: [] as number[] }];

  // Build a full 12-slot array keyed by month (1–12)
  const map: Record<number, number> = {};
  chartData.monthlyData.forEach((d) => {
    map[d._id.month] = d.revenue;
  });

  const now = new Date();
  const data: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push(Math.round(map[d.getMonth() + 1] ?? 0));
  }
  return [{ name: "Revenue ($)", data }];
}

function buildCategories() {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_LABELS[d.getMonth()]);
  }
  return labels;
}

export default function RevenueChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard-chart-data"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardChartData>>("/dashboard/chart-data");
      return res.data.data;
    },
  });

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#465fff"],
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.0 },
    },
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories: buildCategories(),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#9CA3AF", fontSize: "12px" } },
    },
    yaxis: {
      labels: {
        formatter: (v) => `৳${(v / 1000).toFixed(0)}K`,
        style: { colors: "#9CA3AF", fontSize: "12px" },
      },
    },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 4 },
    tooltip: {
      y: { formatter: (v) => `৳${Number(v ?? 0).toLocaleString()}` },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Revenue
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Last 12 months (excl. cancelled orders)
        </p>
      </div>

      {isLoading ? (
        <div className="h-[280px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[500px] xl:min-w-full">
            <ReactApexChart
              options={options}
              series={buildSeries(chartData)}
              type="area"
              height={280}
            />
          </div>
        </div>
      )}
    </div>
  );
}
