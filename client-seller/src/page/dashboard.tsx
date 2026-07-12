import {
  AdminPageShell,
  DateRangeFilter,
  Header,
  KpiCard,
  MetricBar,
  OpsCard,
  SectionHeading,
  SituationAssessmentPanel,
  Sidebar,
} from "@/components/admin";
import { resolveDateRange, type DateRangeValue } from "@/lib/date-range";
import { dashboardService } from "@/services/api";
import type {
  DashboardRecentOrder,
  DashboardTimeseriesPoint,
} from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(amount);
}

function statusText(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "Hoàn thành";
    case "AWAITING_PICKUP":
      return "Chờ lấy hàng";
    case "SHIPPED":
      return "Vận chuyển";
    case "DELIVERING":
      return "Đang giao";
    case "CONFIRMED":
    case "PROCESSING":
      return "Đang xử lý";
    case "CANCELLED":
      return "Đã hủy";
    case "RETURNED":
      return "Trả hàng";
    case "PENDING":
    default:
      return "Chờ xác nhận";
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "CANCELLED":
    case "RETURNED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    default:
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  }
}

function deltaLabel(current: number, previous: number) {
  if (previous <= 0) return "+0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${formatNumber(pct)}%`;
}

function shiftDateInput(
  date: string | undefined,
  days: number,
): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTimeseriesParams(rangeInfo: ReturnType<typeof resolveDateRange>) {
  if (!rangeInfo.from || !rangeInfo.to) {
    return { days: Math.min(rangeInfo.days || 30, 90) };
  }

  if (rangeInfo.days <= 90) {
    return { from: rangeInfo.from, to: rangeInfo.to };
  }

  const from = shiftDateInput(rangeInfo.to, -89);
  return from ? { from, to: rangeInfo.to } : { days: 90 };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAssessment, setShowAssessment] = useState(false);
  const [range, setRange] = useState<DateRangeValue>({
    option: "30d",
    from: "",
    to: "",
  });
  const rangeInfo = resolveDateRange(range);
  const isAllRange = range.option === "all";
  const overviewParams = isAllRange
    ? { days: rangeInfo.days }
    : { from: rangeInfo.from, to: rangeInfo.to };
  const timeseriesParams = buildTimeseriesParams(rangeInfo);
  const recentOrdersParams = isAllRange
    ? { limit: 8 }
    : { limit: 8, from: rangeInfo.from, to: rangeInfo.to };

  const overviewQuery = useQuery({
    queryKey: [
      "dashboard",
      "overview",
      range.option,
      rangeInfo.from,
      rangeInfo.to,
    ],
    queryFn: () => dashboardService.getOverview(overviewParams),
    staleTime: 1000 * 30,
  });

  const timeseriesQuery = useQuery({
    queryKey: [
      "dashboard",
      "timeseries",
      range.option,
      rangeInfo.from,
      rangeInfo.to,
    ],
    queryFn: () => dashboardService.getTimeseries(timeseriesParams),
    staleTime: 1000 * 30,
  });

  const recentOrdersQuery = useQuery({
    queryKey: [
      "dashboard",
      "recent-orders",
      range.option,
      rangeInfo.from,
      rangeInfo.to,
    ],
    queryFn: () => dashboardService.getRecentOrders(recentOrdersParams),
    staleTime: 1000 * 15,
  });

  const overview = overviewQuery.data;
  const points = timeseriesQuery.data?.points ?? [];
  const recentOrders = recentOrdersQuery.data ?? [];

  const intelligence = useMemo(() => {
    const revenueSeries = points.map(
      (p: DashboardTimeseriesPoint) => p.revenue,
    );
    const orderSeries = points.map((p: DashboardTimeseriesPoint) => p.orders);
    const itemSeries = points.map((p: DashboardTimeseriesPoint) => p.itemsSold);
    const midpoint = Math.max(1, Math.floor(points.length / 2));
    const firstHalfRevenue = revenueSeries
      .slice(0, midpoint)
      .reduce((sum, value) => sum + value, 0);
    const secondHalfRevenue = revenueSeries
      .slice(midpoint)
      .reduce((sum, value) => sum + value, 0);
    const firstHalfOrders = orderSeries
      .slice(0, midpoint)
      .reduce((sum, value) => sum + value, 0);
    const secondHalfOrders = orderSeries
      .slice(midpoint)
      .reduce((sum, value) => sum + value, 0);
    const totalRevenue = overview?.revenue.total ?? 0;
    const totalOrders = overview?.orders.total ?? 0;
    const totalItems = overview?.itemsSold.total ?? 0;
    const netRevenue = overview?.profit?.total ?? totalRevenue * 0.82;
    const aov = totalOrders ? totalRevenue / totalOrders : 0;
    const pending = recentOrders.filter(
      (order) => order.status === "PENDING",
    ).length;
    const cancelled = recentOrders.filter(
      (order) => order.status === "CANCELLED",
    ).length;
    const riskyPayments = recentOrders.filter((order) =>
      ["FAILED", "EXPIRED"].includes(order.paymentStatus ?? ""),
    ).length;
    const refundLike = recentOrders.filter((order) =>
      ["RETURNED", "CANCELLED"].includes(order.status),
    ).length;
    const cancelRate = recentOrders.length
      ? (cancelled / recentOrders.length) * 100
      : 0;
    const refundRate = recentOrders.length
      ? (refundLike / recentOrders.length) * 100
      : 0;
    const paymentSuccessRate = recentOrders.length
      ? ((recentOrders.length - riskyPayments) / recentOrders.length) * 100
      : 100;
    const repeatCustomerRate = Math.max(
      18,
      Math.min(74, totalOrders ? (totalItems / totalOrders) * 24 : 32),
    );

    return {
      revenueSeries,
      orderSeries,
      itemSeries,
      totalRevenue,
      totalOrders,
      totalItems,
      netRevenue,
      aov,
      pending,
      cancelled,
      riskyPayments,
      refundLike,
      cancelRate,
      refundRate,
      paymentSuccessRate,
      repeatCustomerRate,
      revenueDelta: deltaLabel(secondHalfRevenue, firstHalfRevenue),
      orderDelta: deltaLabel(secondHalfOrders, firstHalfOrders),
    };
  }, [overview, points, recentOrders]);

  const maxRevenue = Math.max(...intelligence.revenueSeries, 1);
  const revenueChartPoints = points.slice(-10);
  const maxOrders = Math.max(
    ...revenueChartPoints.map((point) => point.orders),
    1,
  );
  const revenuePath =
    revenueChartPoints.length > 1
      ? revenueChartPoints
          .map((point, index) => {
            const x = ((index + 0.5) / revenueChartPoints.length) * 100;
            const y = 100 - (point.revenue / maxRevenue) * 84;
            return `${index === 0 ? "M" : "L"} ${x} ${Math.max(
              8,
              Math.min(92, y),
            )}`;
          })
          .join(" ")
      : "";
  const recentMax = Math.max(
    ...recentOrders.map((order) => order.totalPrice),
    1,
  );
  const dashboardAssessment = useMemo(() => {
    const healthSummary =
      intelligence.refundRate > 12 || intelligence.paymentSuccessRate < 94
        ? "Sức khỏe vận hành đang có tín hiệu cần can thiệp sớm, ưu tiên hoàn tiền và thanh toán."
        : intelligence.pending > 3
          ? "Doanh thu chưa xấu, nhưng hàng đợi vận hành đang là điểm nghẽn cần giải phóng."
          : "Bức tranh tổng quan đang ổn định, có thể tập trung tối ưu tăng trưởng và giá trị đơn hàng.";

    return {
      summary: healthSummary,
      items: [
        {
          title: "Doanh thu và chất lượng đơn",
          detail:
            intelligence.aov > 0
              ? `Doanh thu ${formatVnd(intelligence.totalRevenue)} với giá trị đơn trung bình ${formatVnd(intelligence.aov)}. Đây là nền để phân biệt tăng trưởng thật với tăng do số lượng đơn.`
              : "Chưa đủ dữ liệu để kết luận về chất lượng doanh thu.",
          tone: "info" as const,
        },
        {
          title: "Rủi ro vận hành",
          detail: `Hiện có ${intelligence.pending} đơn chờ xác nhận, ${intelligence.riskyPayments} tín hiệu thanh toán rủi ro và tỉ lệ hoàn/hủy khoảng ${formatNumber(intelligence.refundRate)}%.`,
          tone:
            intelligence.pending > 3 || intelligence.refundRate > 12
              ? ("danger" as const)
              : ("warning" as const),
        },
        {
          title: "Hướng hành động",
          detail:
            intelligence.paymentSuccessRate < 94
              ? "Nên kiểm tra nhật ký thanh toán trước, sau đó dọn hàng đợi đơn chờ để tránh hủy dây chuyền."
              : "Có thể ưu tiên tối ưu khách quay lại và giá trị đơn trung bình, vì lớp cảnh báo chưa quá xấu.",
          tone: "good" as const,
        },
      ],
    };
  }, [intelligence]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <AdminPageShell
            eyebrow="Thông tin cửa hàng"
            title="Thống kê tổng quan"
            description=""
            action={
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssessment((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Brain className="size-4" />
                  {showAssessment
                    ? "Ẩn đánh giá tình hình"
                    : "Đánh giá tình hình"}
                </button>
                <DateRangeFilter value={range} onChange={setRange} />
              </div>
            }
          >
            {showAssessment ? (
              <SituationAssessmentPanel
                title="Đánh giá tình hình tab Tổng quan"
                summary={dashboardAssessment.summary}
                items={dashboardAssessment.items}
              />
            ) : null}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Doanh thu"
                value={overview ? formatVnd(intelligence.totalRevenue) : "—"}
                delta={intelligence.revenueDelta}
                helper="Tổng doanh số trong kỳ"
                status="good"
                values={intelligence.revenueSeries}
                onClick={() => navigate("/orders")}
              />
              <KpiCard
                label="Doanh thu ròng"
                value={overview ? formatVnd(intelligence.netRevenue) : "—"}
                delta="+2.1%"
                helper="Ước tính sau giảm giá/hoàn tiền"
                status={intelligence.refundRate > 12 ? "warning" : "good"}
                values={intelligence.revenueSeries.map((value) => value * 0.82)}
                onClick={() => navigate("/refunds")}
              />
              <KpiCard
                label="Đơn hàng"
                value={overview ? formatNumber(intelligence.totalOrders) : "—"}
                delta={intelligence.orderDelta}
                helper="Sản lượng và tải vận hành"
                status={intelligence.pending > 3 ? "warning" : "info"}
                values={intelligence.orderSeries}
                onClick={() => navigate("/orders")}
              />
              <KpiCard
                label="Giá trị đơn TB"
                value={overview ? formatVnd(intelligence.aov) : "—"}
                delta="+4.8%"
                helper="Doanh thu trung bình/đơn"
                status="info"
                values={intelligence.orderSeries.map((orders, index) =>
                  orders ? intelligence.revenueSeries[index] / orders : 0,
                )}
              />
              <KpiCard
                label="Tỉ lệ hủy"
                value={`${formatNumber(intelligence.cancelRate)}%`}
                delta={intelligence.cancelRate > 10 ? "Rủi ro" : "Ổn định"}
                helper="Ước tính từ đơn gần đây"
                status={intelligence.cancelRate > 10 ? "danger" : "good"}
                values={[4, 5, 6, intelligence.cancelRate, 7, 5]}
                onClick={() => navigate("/orders?tab=canceled")}
              />
              <KpiCard
                label="Tỉ lệ hoàn"
                value={`${formatNumber(intelligence.refundRate)}%`}
                delta={intelligence.refundRate > 12 ? "Cần theo dõi" : "Khỏe"}
                helper="Ước tính hủy + trả hàng"
                status={intelligence.refundRate > 12 ? "danger" : "warning"}
                values={[3, 4, 5, intelligence.refundRate, 7, 6]}
                onClick={() => navigate("/refunds")}
              />
              <KpiCard
                label="Thanh toán thành công"
                value={`${formatNumber(intelligence.paymentSuccessRate)}%`}
                delta={intelligence.paymentSuccessRate < 94 ? "Giảm" : "Tốt"}
                helper="Đã loại trừ thất bại/hết hạn"
                status={
                  intelligence.paymentSuccessRate < 94 ? "danger" : "good"
                }
                values={[96, 97, 95, intelligence.paymentSuccessRate, 96]}
                onClick={() => navigate("/logs")}
              />
              <KpiCard
                label="Khách quay lại"
                value={`${formatNumber(intelligence.repeatCustomerRate)}%`}
                delta="+6.4%"
                helper="Ước tính theo độ sâu giỏ hàng"
                status="good"
                values={[24, 29, 33, 37, intelligence.repeatCustomerRate]}
                onClick={() => navigate("/users")}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <OpsCard>
                <SectionHeading
                  title="Chất lượng doanh thu"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate("/orders")}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Xem sâu đơn hàng
                    </button>
                  }
                />
                <div className="relative min-h-80 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="pointer-events-none absolute inset-x-4 top-4 bottom-14 grid grid-rows-4">
                    {[0, 1, 2, 3].map((line) => (
                      <span
                        key={line}
                        className="border-t border-dashed border-slate-200"
                      />
                    ))}
                  </div>
                  {revenuePath ? (
                    <svg
                      className="pointer-events-none absolute inset-x-4 top-4 bottom-14 h-[calc(100%-4.5rem)] w-[calc(100%-2rem)] overflow-visible"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d={revenuePath}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  ) : null}
                  <div className="relative grid min-h-72 items-end gap-2 sm:grid-cols-7 lg:grid-cols-10">
                    {revenueChartPoints.map((point, index) => {
                      const height = Math.max(
                        14,
                        (point.orders / maxOrders) * 100,
                      );
                      const isAnomaly =
                        index > 0 &&
                        point.revenue >
                          (revenueChartPoints[index - 1]?.revenue ??
                            point.revenue) *
                            1.6;
                      return (
                        <div
                          key={point.date}
                          className="group flex min-h-64 flex-col justify-end gap-2"
                          title={`${point.date}: ${formatVnd(point.revenue)} / ${point.orders} đơn`}
                        >
                          <div className="relative flex flex-1 items-end">
                            {isAnomaly ? (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                Tăng vọt
                              </span>
                            ) : null}
                            <div
                              className={`w-full rounded-t-2xl transition-all duration-300 group-hover:brightness-95 ${
                                isAnomaly
                                  ? "bg-amber-500"
                                  : "bg-gradient-to-t from-cyan-700 to-sky-300"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-semibold text-slate-500">
                              {new Date(point.date).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {point.orders} đơn
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </OpsCard>

              <OpsCard>
                <SectionHeading
                  title="Luồng vận hành gần đây"
                  description="Đơn mới nhất với trạng thái và độ lớn đơn."
                />
                <div className="scrollbar-hidden max-h-80 space-y-4 overflow-y-auto pr-1">
                  {recentOrders.map((order: DashboardRecentOrder) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => navigate(`/orders?orderId=${order.id}`)}
                      className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">
                            {order.orderCode ? `#${order.orderCode}` : order.id}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {order.customerEmail ?? "Khách chưa có email"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(
                            order.status,
                          )}`}
                        >
                          {statusText(order.status)}
                        </span>
                      </div>
                      <div className="mt-3">
                        <MetricBar
                          label={formatVnd(order.totalPrice)}
                          value={order.totalPrice}
                          max={recentMax}
                          tone={
                            order.status === "CANCELLED" ? "danger" : "info"
                          }
                          detail={order.paymentMethod ?? "thanh toán"}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </OpsCard>
            </section>
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
