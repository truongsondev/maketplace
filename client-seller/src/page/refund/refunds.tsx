import {
  AlertItem,
  DateRangeFilter,
  Header,
  InsightCard,
  LivePill,
  MetricBar,
  OpsCard,
  SectionHeading,
  Sidebar,
} from "@/components/admin";
import { refundService } from "@/services/api";
import type {
  AdminRefundItem,
  AdminRefundStatus,
  AdminRefundType,
} from "@/types/refund";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveDateRange, type DateRangeValue } from "@/lib/date-range";
import { AlertTriangle, Banknote, Clock3, Truck } from "lucide-react";

function formatMoney(value: string, currency: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function refundTypeText(type: AdminRefundType) {
  return type === "CANCEL_REFUND" ? "Hoàn tiền hủy đơn" : "Hoàn tiền trả hàng";
}

function refundStatusText(status: AdminRefundStatus) {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "SUCCESS":
      return "Thành công";
    case "FAILED":
      return "Thất bại";
    case "RETRYING":
      return "Đang thử lại";
    default:
      return status;
  }
}

function refundStatusClass(status: AdminRefundStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    case "RETRYING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function RefundsPage() {
  const [range, setRange] = useState<DateRangeValue>({
    option: "30d",
    from: "",
    to: "",
  });
  const rangeInfo = resolveDateRange(range);
  const rangeParams =
    range.option === "all"
      ? {}
      : {
          from: rangeInfo.from,
          to: rangeInfo.to,
        };
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminRefundItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<AdminRefundStatus | "">("");
  const [type, setType] = useState<AdminRefundType | "">("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [aggregations, setAggregations] = useState({
    pending: 0,
    success: 0,
    failed: 0,
    retrying: 0,
  });

  const stats = useMemo(
    () => [
      { key: "pending", label: "Chờ xử lý", value: aggregations.pending },
      { key: "success", label: "Thành công", value: aggregations.success },
      { key: "failed", label: "Thất bại", value: aggregations.failed },
      { key: "retrying", label: "Đang thử lại", value: aggregations.retrying },
    ],
    [aggregations],
  );

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await refundService.getRefunds({
        page: 1,
        limit: 30,
        search,
        status: status || undefined,
        type: type || undefined,
        sortBy: "requestedAt",
        sortOrder: "desc",
        ...rangeParams,
      });

      setItems(res.data.items);
      setAggregations(res.data.aggregations);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [search, status, type, rangeInfo.from, rangeInfo.to, range.option]);

  const handleApplySearch = () => {
    const keyword = searchInput.trim();
    setSearch(keyword ? keyword : undefined);
  };

  const handleRetry = async (refundId: string) => {
    try {
      setRetryingId(refundId);
      await refundService.retryRefund(refundId);
      toast.success("Đã xử lý hoàn tiền thành công");
      fetchRefunds();
    } catch (error) {
      console.error(error);
      toast.error("Thử lại hoàn tiền thất bại");
    } finally {
      setRetryingId(null);
    }
  };

  const totalRefunds =
    aggregations.pending +
    aggregations.success +
    aggregations.failed +
    aggregations.retrying;
  const failedRate = totalRefunds
    ? Math.round((aggregations.failed / totalRefunds) * 100)
    : 0;
  const pendingTooLong = items.filter((item) => {
    const requestedAt = new Date(item.requestedAt).getTime();
    return (
      item.status === "PENDING" &&
      Number.isFinite(requestedAt) &&
      Date.now() - requestedAt > 24 * 60 * 60 * 1000
    );
  }).length;
  const cancelRefunds = items.filter((item) => item.type === "CANCEL_REFUND").length;
  const returnRefunds = items.filter((item) => item.type === "RETURN_REFUND").length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-375">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfeff,#fff_34%,#f8fafc)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                    Giám sát chất lượng dịch vụ
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">
                    Hoàn tiền & chất lượng dịch vụ
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Theo dõi SLA hoàn tiền, lỗi retry và nguyên nhân dịch vụ trước khi xử lý từng dòng.
                </p>
              </div>
                <div className="flex flex-wrap items-center gap-3">
                  <LivePill label="Giám sát hoàn tiền" />
                  <DateRangeFilter value={range} onChange={setRange} />
                </div>
              </div>
            </div>

            <section className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <OpsCard className="border-rose-200 bg-gradient-to-br from-white to-rose-50">
                <SectionHeading
                  title="SLA & cảnh báo thất bại"
                  description="Ưu tiên refund thất bại, retry và pending quá lâu."
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <AlertItem
                    tone={aggregations.failed > 0 ? "danger" : "good"}
                    icon={AlertTriangle}
                    title={`${aggregations.failed} refund thất bại`}
                    description="Refund failed cần retry hoặc xử lý thủ công để tránh khiếu nại."
                    action="Lọc FAILED"
                    onClick={() => setStatus("FAILED")}
                  />
                  <AlertItem
                    tone={pendingTooLong > 0 ? "warning" : "good"}
                    icon={Clock3}
                    title={`${pendingTooLong} refund pending > 24h`}
                    description="SLA chậm làm xấu trải nghiệm và tăng tải hỗ trợ."
                    action="Lọc PENDING"
                    onClick={() => setStatus("PENDING")}
                  />
                  <AlertItem
                    tone={aggregations.retrying > 0 ? "warning" : "info"}
                    icon={Banknote}
                    title={`${aggregations.retrying} giao dịch retrying`}
                    description="Theo dõi ngân hàng/cổng thanh toán để tránh retry vòng lặp."
                    action="Xem retry queue"
                    onClick={() => setStatus("RETRYING")}
                  />
                  <AlertItem
                    tone="info"
                    icon={Truck}
                    title={`${returnRefunds} refund do trả hàng`}
                    description="Tín hiệu root-cause liên quan sản phẩm, giao vận hoặc kỳ vọng khách."
                    action="Lọc return refund"
                    onClick={() => setType("RETURN_REFUND")}
                  />
                </div>
              </OpsCard>

              <OpsCard>
                <SectionHeading
                  title="Phân tích nguyên nhân gốc"
                  description="Phân rã theo loại refund và trạng thái để đọc chất lượng dịch vụ."
                />
                <div className="space-y-4">
                  <MetricBar
                    label="Hoàn tiền do hủy"
                    value={cancelRefunds}
                    max={Math.max(totalRefunds, 1)}
                    tone="warning"
                    detail={`${cancelRefunds} trường hợp`}
                  />
                  <MetricBar
                    label="Hoàn tiền do trả hàng"
                    value={returnRefunds}
                    max={Math.max(totalRefunds, 1)}
                    tone="info"
                    detail={`${returnRefunds} trường hợp`}
                  />
                  <MetricBar
                    label="Tỉ lệ thất bại"
                    value={failedRate}
                    max={100}
                    tone={failedRate > 10 ? "danger" : "good"}
                    detail={`${failedRate}%`}
                  />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InsightCard
                    tone="warning"
                    priority="Xu hướng SKU"
                    metric="Bước tiếp theo"
                    title="Refund theo SKU/category"
                    description="Khi API có dimension SKU/category, card này sẽ highlight sản phẩm gây refund bất thường."
                  />
                  <InsightCard
                    tone="info"
                    priority="Thanh toán"
                    metric={`${aggregations.retrying}`}
                    title="Refund theo phương thức thanh toán"
                    description="Tỉ lệ thử lại/thất bại cao theo phương thức thanh toán là tín hiệu vận hành thanh toán cần xử lý."
                  />
                </div>
              </OpsCard>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              {stats.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplySearch();
                }}
                placeholder="Tìm theo mã hoàn tiền, mã đơn, email, mã đơn hàng"
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AdminRefundStatus | "")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
                <option value="RETRYING">Đang thử lại</option>
              </select>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as AdminRefundType | "")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">Tất cả loại</option>
                <option value="CANCEL_REFUND">Hoàn tiền hủy đơn</option>
                <option value="RETURN_REFUND">Hoàn tiền trả hàng</option>
              </select>

              <button
                onClick={handleApplySearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tìm
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-3">Đơn hàng</div>
                <div className="col-span-2">Loại hoàn tiền</div>
                <div className="col-span-2">Số tiền</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2">Thời gian</div>
                <div className="col-span-1 text-right">Hành động</div>
              </div>

              {loading ? (
                <div className="p-8 text-sm text-gray-600">Đang tải...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-sm text-gray-600">
                  Không có dữ liệu hoàn tiền.
                </div>
              ) : (
                <div>
                  {items.map((item) => {
                    const canRetry =
                      item.status === "FAILED" || item.status === "RETRYING";

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 px-6 py-5 border-b border-gray-100"
                      >
                        <div className="col-span-3">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.payment.orderCode ?? item.orderId}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.user.email ?? item.user.phone ?? item.user.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            #{item.id}
                          </p>
                        </div>

                        <div className="col-span-2 flex items-center text-sm text-gray-700">
                          {refundTypeText(item.type)}
                        </div>

                        <div className="col-span-2 flex items-center text-sm font-semibold text-gray-900">
                          {formatMoney(item.amount, item.currency)}
                        </div>

                        <div className="col-span-2 flex items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${refundStatusClass(item.status)}`}
                          >
                            {refundStatusText(item.status)}
                          </span>
                        </div>

                        <div className="col-span-2 flex flex-col justify-center text-xs text-gray-600">
                          <span>Yêu cầu: {formatDate(item.requestedAt)}</span>
                          <span>Xử lý: {formatDate(item.processedAt)}</span>
                        </div>

                        <div className="col-span-1 flex items-center justify-end">
                          <button
                            onClick={() => handleRetry(item.id)}
                            disabled={!canRetry || retryingId === item.id}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              canRetry
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Thử lại
                          </button>
                        </div>

                        {item.failureReason ? (
                          <div className="col-span-12 mt-3 text-xs text-red-600">
                            Lý do lỗi: {item.failureReason}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
