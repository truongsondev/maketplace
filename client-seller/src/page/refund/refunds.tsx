import { DateRangeFilter, Header, Sidebar } from "@/components/admin";
import { refundService } from "@/services/api";
import type {
  AdminRefundItem,
  AdminRefundStatus,
  AdminRefundType,
} from "@/types/refund";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveDateRange, type DateRangeValue } from "@/lib/date-range";

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hoàn tiền</h1>
                <p className="text-gray-600 mt-1">
                  Theo dõi và xử lý hoàn tiền đơn hàng
                </p>
              </div>
              <DateRangeFilter value={range} onChange={setRange} />
            </div>

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
