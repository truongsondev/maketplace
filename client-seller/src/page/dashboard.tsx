import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "@/services/api";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function mapOrderStatusToLabel(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "Hoàn thành";
    case "SHIPPED":
      return "Đang giao";
    case "CONFIRMED":
    case "PROCESSING":
      return "Đang xử lý";
    case "CANCELLED":
      return "Đã hủy";
    case "PENDING":
    default:
      return "Chờ xác nhận";
  }
}

function sumLastNDays(values: number[], n: number): number {
  const startIndex = Math.max(0, values.length - n);
  let sum = 0;
  for (let i = startIndex; i < values.length; i += 1) sum += values[i] ?? 0;
  return sum;
}

function buildSparklinePath(
  values: number[],
  width: number,
  height: number,
): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((v, idx) => {
      const x = (idx / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Dashboard() {
  const navigate = useNavigate();

  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: dashboardService.getOverview,
    staleTime: 1000 * 30,
  });

  const timeseriesQuery = useQuery({
    queryKey: ["dashboard", "timeseries", 30],
    queryFn: () => dashboardService.getTimeseries(30),
    staleTime: 1000 * 30,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard", "recent-orders", 5],
    queryFn: () => dashboardService.getRecentOrders(5),
    staleTime: 1000 * 15,
  });

  const overview = overviewQuery.data;
  const recentOrders = recentOrdersQuery.data ?? [];

  const seriesRevenues =
    timeseriesQuery.data?.points?.map((p) => p.revenue) ?? [];
  const seriesOrders = timeseriesQuery.data?.points?.map((p) => p.orders) ?? [];
  const todayRevenue = overview?.revenue?.today ?? 0;
  const weekRevenue = sumLastNDays(seriesRevenues, 7);
  const monthRevenue = overview?.revenue?.month ?? 0;
  const maxRevenue = Math.max(todayRevenue, weekRevenue, monthRevenue, 1);

  const sparklinePath = buildSparklinePath(seriesRevenues, 520, 120);

  const stats = [
    {
      label: "Doanh thu (Hôm nay / Tháng / Năm)",
      primary: overview ? formatVnd(overview.revenue.month) : "—",
      secondary: overview
        ? [
            { k: "Hôm nay", v: formatVnd(overview.revenue.today) },
            { k: "Tháng", v: formatVnd(overview.revenue.month) },
            { k: "Năm", v: formatVnd(overview.revenue.year) },
          ]
        : [],
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      label: "Đơn hàng (Hôm nay / Tháng / Năm)",
      primary: overview
        ? new Intl.NumberFormat("vi-VN").format(overview.orders.month)
        : "—",
      secondary: overview
        ? [
            {
              k: "Hôm nay",
              v: new Intl.NumberFormat("vi-VN").format(overview.orders.today),
            },
            {
              k: "Tháng",
              v: new Intl.NumberFormat("vi-VN").format(overview.orders.month),
            },
            {
              k: "Năm",
              v: new Intl.NumberFormat("vi-VN").format(overview.orders.year),
            },
          ]
        : [],
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      label: "Sản phẩm bán ra (Hôm nay / Tháng / Năm)",
      primary: overview
        ? new Intl.NumberFormat("vi-VN").format(overview.itemsSold.month)
        : "—",
      secondary: overview
        ? [
            {
              k: "Hôm nay",
              v: new Intl.NumberFormat("vi-VN").format(
                overview.itemsSold.today,
              ),
            },
            {
              k: "Tháng",
              v: new Intl.NumberFormat("vi-VN").format(
                overview.itemsSold.month,
              ),
            },
            {
              k: "Năm",
              v: new Intl.NumberFormat("vi-VN").format(overview.itemsSold.year),
            },
          ]
        : [],
      icon: Package,
      color: "bg-orange-500",
    },
    {
      label: "Lợi nhuận (Hôm nay / Tháng / Năm)",
      primary: overview?.profit ? formatVnd(overview.profit.month) : "—",
      secondary: overview?.profit
        ? [
            { k: "Hôm nay", v: formatVnd(overview.profit.today) },
            { k: "Tháng", v: formatVnd(overview.profit.month) },
            { k: "Năm", v: formatVnd(overview.profit.year) },
          ]
        : [],
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hoàn thành":
        return "bg-green-100 text-green-700";
      case "Đang xử lý":
        return "bg-blue-100 text-blue-700";
      case "Đang giao":
        return "bg-purple-100 text-purple-700";
      case "Chờ xác nhận":
        return "bg-yellow-100 text-yellow-700";
      case "Đã hủy":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none flex flex-col">
            <div className="mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group bg-white rounded-lg p-6 shadow-sm border border-gray-200 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`${stat.color} p-3 rounded-lg transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {overviewQuery.isError ? (
                        <div className="text-sm text-red-600 font-medium">
                          Lỗi
                        </div>
                      ) : overviewQuery.isLoading ? (
                        <div className="text-sm text-gray-400 font-medium">
                          Đang tải...
                        </div>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.primary}
                    </p>
                    {stat.secondary.length ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {stat.secondary.map((item) => (
                          <div key={item.k} className="text-xs text-gray-600">
                            <div className="text-gray-500">{item.k}</div>
                            <div className="font-medium text-gray-900 truncate">
                              {item.v}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 transition-all duration-200 ease-out hover:shadow-md motion-reduce:transition-none h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Đơn hàng gần đây
                  </h2>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => navigate("/orders")}
                  >
                    Xem tất cả
                  </button>
                </div>
                {recentOrders.map((order) => {
                  const statusLabel = mapOrderStatusToLabel(order.status);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0 rounded-md px-2 -mx-2 transition-colors duration-150 hover:bg-gray-50 motion-reduce:transition-none"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.orderCode ? `#${order.orderCode}` : order.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.customerEmail ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatVnd(order.totalPrice)}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            statusLabel,
                          )}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 transition-all duration-200 ease-out hover:shadow-md motion-reduce:transition-none h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hoạt động bán hàng
                  </h2>
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hôm nay</span>
                    <span className="font-semibold text-gray-900">
                      {overview ? formatVnd(todayRevenue) : "—"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(5, Math.min(100, Math.round((todayRevenue / maxRevenue) * 100)))}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tuần này</span>
                    <span className="font-semibold text-gray-900">
                      {overview ? formatVnd(weekRevenue) : "—"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(5, Math.min(100, Math.round((weekRevenue / maxRevenue) * 100)))}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tháng này</span>
                    <span className="font-semibold text-gray-900">
                      {overview ? formatVnd(monthRevenue) : "—"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(5, Math.min(100, Math.round((monthRevenue / maxRevenue) * 100)))}%`,
                      }}
                    ></div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        30 ngày gần đây
                      </span>
                      <span className="text-xs text-gray-500">
                        {timeseriesQuery.isLoading
                          ? "Đang tải..."
                          : timeseriesQuery.isError
                            ? "Lỗi"
                            : `${new Intl.NumberFormat("vi-VN").format(sumLastNDays(seriesOrders, 30))} đơn hàng`}
                      </span>
                    </div>
                    <div className="w-full flex-1 min-h-30">
                      {sparklinePath ? (
                        <svg
                          viewBox="0 0 520 120"
                          className="w-full h-full"
                          preserveAspectRatio="none"
                        >
                          <path
                            d={sparklinePath}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2"
                          />
                        </svg>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Không có dữ liệu
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
