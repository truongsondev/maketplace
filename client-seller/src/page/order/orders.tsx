import { DateRangeFilter, Header, Sidebar } from "@/components/admin";
import { resolveDateRange, type DateRangeValue } from "@/lib/date-range";
import { orderService } from "@/services/api";
import type {
  AdminOrderListItem,
  AdminOrderSort,
  AdminOrderTab,
  OrderStatus,
  AdminOrderStatusBreakdown,
  AdminOrderTimeseries,
} from "@/types/order";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type RowActionItem = {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "warning" | "success" | "danger";
};

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function toMoneyNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: string) {
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

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
    case "PAID":
      return "bg-blue-100 text-blue-700";
    case "SHIPPED":
    case "DELIVERED":
      return "bg-purple-100 text-purple-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "RETURNED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusText(status: string) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đang xử lý";
    case "PAID":
      return "Đã thanh toán";
    case "SHIPPED":
      return "Đang giao";
    case "DELIVERED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "RETURNED":
      return "Đang trả hàng";
    default:
      return status;
  }
}

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

function buildSparklinePath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const stepX = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values.map((v, idx) => {
    const x = idx * stepX;
    const y = height - (v / max) * height;
    return [x, y] as const;
  });
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function primaryActionLabel(status: string) {
  if (status === "PAID") return "Xác nhận";
  if (status === "CONFIRMED") return "Bàn giao cho shipper";
  return "—";
}

function cancelReasonText(code: string) {
  switch (code) {
    case "NO_LONGER_NEEDED":
      return "Không muốn mua nữa";
    case "BUY_OTHER_ITEM":
      return "Mua hàng khác";
    case "FOUND_CHEAPER":
      return "Có chỗ khác rẻ hơn";
    case "OTHER":
      return "Khác";
    default:
      return code;
  }
}

function cancelRequestStatusText(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Đã từ chối";
    case "COMPLETED":
      return "Đã hoàn tất";
    default:
      return status;
  }
}

function returnReasonText(code?: string | null) {
  switch (code) {
    case "WRONG_MODEL":
      return "Không đúng mẫu";
    case "WRONG_SIZE":
      return "Không vừa, muốn đổi size";
    case "DEFECTIVE":
      return "Hàng bị lỗi";
    default:
      return code || "Chưa có lý do";
  }
}

function paymentStatusText(status?: string | null) {
  if (!status) {
    return "Không rõ";
  }

  switch (status) {
    case "PAID":
    case "SUCCESS":
      return "Thành công";
    case "PENDING":
      return "Đang chờ";
    case "FAILED":
      return "Thất bại";
    case "EXPIRED":
      return "Hết hạn";
    default:
      return status;
  }
}

function formatShippingAddress(order: AdminOrderListItem) {
  const shipping = order.shipping;
  if (!shipping) {
    return "Chua co du lieu dia chi giao hang";
  }

  const parts = [
    shipping.addressLine,
    shipping.ward,
    shipping.district,
    shipping.city,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);

  return parts.length > 0
    ? parts.join(", ")
    : "Chua co du lieu dia chi giao hang";
}

function RowActionsMenu({ actions }: { actions: RowActionItem[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mở danh sách tác vụ"
      >
        ...
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {actions.map((action) => {
            const toneClass =
              action.tone === "danger"
                ? "text-red-700 hover:bg-red-50"
                : action.tone === "warning"
                  ? "text-orange-700 hover:bg-orange-50"
                  : action.tone === "success"
                    ? "text-emerald-700 hover:bg-emerald-50"
                    : "text-slate-700 hover:bg-slate-100";

            return (
              <button
                key={action.key}
                type="button"
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (action.disabled) {
                    return;
                  }
                  setOpen(false);
                  action.onClick();
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  action.disabled
                    ? "cursor-not-allowed text-slate-400"
                    : toneClass
                }`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRangeValue>({
    option: "30d",
    from: "",
    to: "",
  });
  const rangeInfo = resolveDateRange(range);
  const isAllRange = range.option === "all";
  const rangeParams = isAllRange
    ? {}
    : {
        from: rangeInfo.from,
        to: rangeInfo.to,
      };
  const analyticsParams = isAllRange
    ? { days: rangeInfo.days }
    : { from: rangeInfo.from, to: rangeInfo.to };
  const [tab, setTab] = useState<AdminOrderTab>("all");
  const [sort, setSort] = useState<AdminOrderSort>("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    canceled: 0,
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [statusBreakdown, setStatusBreakdown] = useState<
    AdminOrderStatusBreakdown | undefined
  >(undefined);
  const [timeseries, setTimeseries] = useState<
    AdminOrderTimeseries | undefined
  >(undefined);

  const [hoveredStatus, setHoveredStatus] = useState<
    { status: OrderStatus; value: number; pct: number } | undefined
  >(undefined);
  const [hoveredPoint, setHoveredPoint] = useState<
    { index: number; date: string; total: number } | undefined
  >(undefined);
  const [hoveredPointPos, setHoveredPointPos] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [cancelModal, setCancelModal] = useState<
    { orderId: string; status: string } | undefined
  >(undefined);
  const [detailModal, setDetailModal] = useState<
    AdminOrderListItem | undefined
  >(undefined);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "Tất cả", count: counts.all },
      { key: "pending" as const, label: "Chờ xác nhận", count: counts.pending },
      {
        key: "processing" as const,
        label: "Đang xử lý",
        count: counts.processing,
      },
      { key: "shipped" as const, label: "Đang giao", count: counts.shipped },
      {
        key: "completed" as const,
        label: "Hoàn thành",
        count: counts.completed,
      },
      { key: "canceled" as const, label: "Đã hủy", count: counts.canceled },
    ],
    [counts],
  );

  const fetchCounts = async () => {
    try {
      const res = await orderService.getCounts(rangeParams);
      setCounts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [statusRes, seriesRes] = await Promise.all([
        orderService.getAnalyticsStatus(analyticsParams),
        orderService.getAnalyticsTimeseries(analyticsParams),
      ]);
      setStatusBreakdown(statusRes.data);
      setTimeseries(seriesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        tab,
        sort,
        search,
        page: 1,
        limit: 20,
        ...rangeParams,
      });
      setOrders(res.data.items);
    } catch (e) {
      toast.error("Không thể tải danh sách đơn hàng");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchAnalytics();
  }, [rangeInfo.from, rangeInfo.to, range.option]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const nextSearch = query.get("search")?.trim() || "";
    const orderId = query.get("orderId")?.trim() || "";
    const keyword = nextSearch || orderId;
    setSearchInput(keyword);
    setSearch(keyword || undefined);
  }, [location.search]);

  useEffect(() => {
    fetchOrders();
  }, [tab, sort, search, rangeInfo.from, rangeInfo.to, range.option]);

  useEffect(() => {
    const orderId = new URLSearchParams(location.search).get("orderId")?.trim();
    if (loading) {
      return;
    }

    if (!orderId) {
      setDetailModal((prev) => (prev ? undefined : prev));
      return;
    }

    const matched = orders.find((order) => order.id === orderId);
    if (matched) {
      setDetailModal((prev) => (prev?.id === matched.id ? prev : matched));
    }
  }, [location.search, orders, loading]);

  const handleApplySearch = () => {
    const s = searchInput.trim();
    setSearch(s ? s : undefined);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await orderService.exportOrders({
        tab,
        search,
        sort,
        ...rangeParams,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Xuất file CSV thành công");
    } catch (e) {
      toast.error("Xuất file CSV thất bại");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const openCancelModal = (orderId: string, status: string) => {
    setCancelModal({ orderId, status });
    setCancelReason("");
  };

  const closeCancelModal = () => {
    if (cancelSubmitting) {
      return;
    }
    setCancelModal(undefined);
    setCancelReason("");
  };

  const openDetailModal = (order: AdminOrderListItem) => {
    setDetailModal(order);
    const query = new URLSearchParams(location.search);
    query.set("orderId", order.id);
    navigate(
      {
        pathname: location.pathname,
        search: query.toString() ? `?${query.toString()}` : "",
      },
      { replace: true },
    );
  };

  const closeDetailModal = () => {
    setDetailModal(undefined);
    const query = new URLSearchParams(location.search);
    query.delete("orderId");
    navigate(
      {
        pathname: location.pathname,
        search: query.toString() ? `?${query.toString()}` : "",
      },
      { replace: true },
    );
  };

  const handleCancel = async () => {
    if (!cancelModal) {
      return;
    }

    const mustProvideReason = cancelModal.status === "PAID";
    if (mustProvideReason && !cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy cho đơn đã thanh toán");
      return;
    }

    try {
      setCancelSubmitting(true);
      await orderService.cancelOrder(
        cancelModal.orderId,
        cancelReason.trim() || undefined,
      );
      toast.success("Đã hủy đơn hàng");
      setCancelModal(undefined);
      setCancelReason("");
      fetchCounts();
      fetchAnalytics();
      fetchOrders();
    } catch (e) {
      toast.error("Hủy đơn hàng thất bại");
      console.error(e);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleConfirm = async (orderId: string) => {
    try {
      const check = await orderService.checkConfirmOrder(orderId);
      if (!check.data.canConfirm) {
        const firstBlockingItem = check.data.blockingItems[0];
        const firstBlockingReason = firstBlockingItem?.reasons?.[0];
        const firstIssue = check.data.issues[0];

        toast.error(
          firstBlockingReason ||
            firstIssue ||
            "Đơn hàng không hợp lệ để xác nhận",
        );
        return;
      }

      await orderService.confirmOrder(orderId);
      toast.success("Đã xác nhận đơn hàng");
      fetchCounts();
      fetchAnalytics();
      fetchOrders();
    } catch (e) {
      toast.error("Xác nhận đơn hàng thất bại");
      console.error(e);
    }
  };

  const handleShip = async (orderId: string) => {
    try {
      await orderService.shipOrder(orderId);
      toast.success("Đã bàn giao cho shipper");
      fetchCounts();
      fetchAnalytics();
      fetchOrders();
    } catch (e) {
      toast.error("Bàn giao cho shipper thất bại");
      console.error(e);
    }
  };

  const handleApproveReturns = async (orderId: string) => {
    try {
      await orderService.approveReturns(orderId);
      toast.success("Đã duyệt trả hàng");
      setDetailModal(undefined);
      fetchOrders();
    } catch (e) {
      toast.error("Duyệt trả hàng thất bại");
      console.error(e);
    }
  };

  const handleApproveCancelRequest = async (orderId: string) => {
    try {
      await orderService.approveCancelRequest(orderId);
      toast.success("Đã duyệt yêu cầu hủy đơn");
      fetchOrders();
    } catch (e) {
      toast.error("Duyệt yêu cầu hủy thất bại");
      console.error(e);
    }
  };

  const handleRejectCancelRequest = async (orderId: string) => {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu hủy:")?.trim();
    if (!reason) {
      return;
    }

    try {
      await orderService.rejectCancelRequest(orderId, reason);
      toast.success("Đã từ chối yêu cầu hủy đơn");
      fetchOrders();
    } catch (e) {
      toast.error("Từ chối yêu cầu hủy thất bại");
      console.error(e);
    }
  };

  const handleCompleteManualRefund = async (orderId: string) => {
    try {
      await orderService.completeCancelManualRefund(orderId);
      toast.success("Đã xác nhận hoàn tiền thủ công thành công");
      fetchCounts();
      fetchAnalytics();
      fetchOrders();
    } catch (e) {
      toast.error("Xác nhận hoàn tiền thủ công thất bại");
      console.error(e);
    }
  };

  const handleRejectReturns = async (orderId: string) => {
    try {
      await orderService.rejectReturns(orderId);
      toast.success("Đã từ chối trả hàng");
      setDetailModal(undefined);
      fetchOrders();
    } catch (e) {
      toast.error("Từ chối trả hàng thất bại");
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-375">
            <section className="rounded-3xl border border-slate-200 bg-linear-to-r from-white via-white to-cyan-50 px-6 py-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Trung tâm đơn hàng
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Quản lý đơn hàng
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Theo dõi luồng đơn và xử lý nhanh các hành động vận hành.
                  </p>
                  <div className="mt-4">
                    <DateRangeFilter value={range} onChange={setRange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Tổng đơn</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {counts.all}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs text-amber-700">Chờ xác nhận</p>
                    <p className="mt-1 text-xl font-bold text-amber-800">
                      {counts.pending}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700">Đang xử lý</p>
                    <p className="mt-1 text-xl font-bold text-blue-800">
                      {counts.processing}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs text-red-700">Đã hủy</p>
                    <p className="mt-1 text-xl font-bold text-red-800">
                      {counts.canceled}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Đơn hàng theo trạng thái
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {rangeInfo.label}
                    </p>
                  </div>
                  {statusBreakdown ? (
                    <p className="text-xs text-slate-600">
                      Tổng:{" "}
                      <span className="font-semibold">
                        {statusBreakdown.total}
                      </span>
                    </p>
                  ) : null}
                </div>

                {analyticsLoading ? (
                  <div className="mt-4 text-sm text-slate-600">Đang tải…</div>
                ) : !statusBreakdown ? (
                  <div className="mt-4 text-sm text-slate-600">
                    Không thể tải thống kê.
                  </div>
                ) : (
                  <div className="relative mt-4 space-y-3">
                    {STATUS_ORDER.map((status) => {
                      const value = statusBreakdown.counts[status] ?? 0;
                      const pct = statusBreakdown.total
                        ? Math.round((value / statusBreakdown.total) * 100)
                        : 0;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-700">
                              {statusText(status)}
                            </span>
                            <span className="text-slate-600">
                              {value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-cyan-600"
                              style={{
                                width: `${statusBreakdown.total ? (value / statusBreakdown.total) * 100 : 0}%`,
                              }}
                              onMouseEnter={() =>
                                setHoveredStatus({ status, value, pct })
                              }
                              onMouseLeave={() => setHoveredStatus(undefined)}
                              title={`${statusText(status)}: ${value} (${pct}%)`}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {hoveredStatus ? (
                      <div className="pointer-events-none absolute right-0 top-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">
                          {statusText(hoveredStatus.status)}
                        </p>
                        <p className="mt-0.5">
                          Số lượng:{" "}
                          <span className="font-semibold">
                            {hoveredStatus.value}
                          </span>
                        </p>
                        <p>
                          Tỉ lệ:{" "}
                          <span className="font-semibold">
                            {hoveredStatus.pct}%
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Số lượng đơn theo thời gian
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {rangeInfo.label}
                    </p>
                  </div>
                  {timeseries ? (
                    <p className="text-xs text-slate-600">
                      Tổng:{" "}
                      <span className="font-semibold">
                        {timeseries.points.reduce((s, p) => s + p.total, 0)}
                      </span>
                    </p>
                  ) : null}
                </div>

                {analyticsLoading ? (
                  <div className="mt-4 text-sm text-slate-600">Đang tải…</div>
                ) : !timeseries ? (
                  <div className="mt-4 text-sm text-slate-600">
                    Không thể tải thống kê.
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Hôm nay</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {timeseries.points[timeseries.points.length - 1]
                            ?.total ?? 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Đỉnh</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {Math.max(
                            ...timeseries.points.map((p) => p.total),
                            0,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <svg
                        viewBox="0 0 360 120"
                        className="h-32 w-full"
                        onMouseMove={(e) => {
                          const el = e.currentTarget;
                          const rect = el.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;

                          const n = timeseries.points.length;
                          if (n <= 0) return;

                          const ratio = rect.width > 0 ? x / rect.width : 0;
                          const idx = Math.max(
                            0,
                            Math.min(n - 1, Math.round(ratio * (n - 1))),
                          );

                          const p = timeseries.points[idx];
                          if (!p) return;

                          setHoveredPoint({
                            index: idx,
                            date: p.date,
                            total: p.total,
                          });
                          setHoveredPointPos({ x, y });
                        }}
                        onMouseLeave={() => {
                          setHoveredPoint(undefined);
                          setHoveredPointPos(undefined);
                        }}
                      >
                        <path
                          d={buildSparklinePath(
                            timeseries.points.map((p) => p.total),
                            360,
                            120,
                          )}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-cyan-600"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {hoveredPoint ? (
                          <circle
                            cx={
                              (hoveredPoint.index * 360) /
                              Math.max(timeseries.points.length - 1, 1)
                            }
                            cy={(() => {
                              const max = Math.max(
                                ...timeseries.points.map((p) => p.total),
                                1,
                              );
                              const h = 120;
                              return h - (hoveredPoint.total / max) * h;
                            })()}
                            r="4.5"
                            className="fill-cyan-600"
                          />
                        ) : null}
                      </svg>

                      {hoveredPoint && hoveredPointPos ? (
                        <div
                          className="pointer-events-none absolute rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
                          style={{
                            left: Math.min(
                              Math.max(hoveredPointPos.x + 12, 8),
                              260,
                            ),
                            top: Math.min(
                              Math.max(hoveredPointPos.y + 12, 8),
                              92,
                            ),
                          }}
                        >
                          <p className="font-semibold text-slate-900">
                            {hoveredPoint.date}
                          </p>
                          <p className="mt-0.5">
                            Số lượng:{" "}
                            <span className="font-semibold">
                              {hoveredPoint.total}
                            </span>
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{timeseries.points[0]?.date}</span>
                        <span>
                          {
                            timeseries.points[timeseries.points.length - 1]
                              ?.date
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        tab === t.key
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {t.label} ({t.count})
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplySearch();
                    }}
                    placeholder="Tìm theo id, email, mã đơn"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/30 sm:w-80"
                  />

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as AdminOrderSort)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="new">Mới nhất</option>
                    <option value="old">Cũ nhất</option>
                  </select>

                  <button
                    onClick={handleApplySearch}
                    className="h-11 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
                  >
                    Tìm đơn
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={loading || exporting}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exporting ? "Đang xuất..." : "Xuất CSV"}
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div className="min-w-325">
                  <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700">
                    <div className="col-span-4">Sản phẩm</div>
                    <div className="col-span-2">Giá trị đơn</div>
                    <div className="col-span-2">Thanh toán</div>
                    <div className="col-span-1">Trạng thái</div>
                    <div className="col-span-3 text-right">Tác vụ</div>
                  </div>

                  {loading ? (
                    <div className="p-8 text-sm text-slate-600">
                      Đang tải dữ liệu...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-8 text-sm text-slate-600">
                      Không có đơn hàng phù hợp.
                    </div>
                  ) : (
                    <div>
                      {orders.map((order) => {
                        const first = order.items[0];
                        const extraCount = Math.max(order.items.length - 1, 0);
                        const canCancel =
                          order.status === "PENDING" ||
                          order.status === "PAID" ||
                          order.status === "CONFIRMED";

                        const primaryLabel = primaryActionLabel(order.status);
                        const handlePrimary = () => {
                          if (order.status === "PAID")
                            return handleConfirm(order.id);
                          if (order.status === "CONFIRMED")
                            return handleShip(order.id);
                          return;
                        };

                        const requestedReturns = order.returns?.requested ?? 0;
                        const hasReturnRequest = requestedReturns > 0;
                        const cancelRequest = order.cancelRequest;
                        const cancelRefund = order.cancelRefund;
                        const isCancelFlowApproved =
                          cancelRequest?.status === "APPROVED" ||
                          cancelRequest?.status === "COMPLETED";

                        const canPrimary =
                          (order.status === "PAID" ||
                            order.status === "CONFIRMED") &&
                          !isCancelFlowApproved;

                        const secondaryActions: RowActionItem[] = [];

                        if (hasReturnRequest) {
                          secondaryActions.push(
                            {
                              key: `approve-return-${order.id}`,
                              label: "Duyệt trả hàng",
                              onClick: () => handleApproveReturns(order.id),
                              tone: "success",
                            },
                            {
                              key: `reject-return-${order.id}`,
                              label: "Từ chối trả hàng",
                              onClick: () => handleRejectReturns(order.id),
                            },
                          );
                        }

                        if (cancelRequest?.status === "REQUESTED") {
                          secondaryActions.push(
                            {
                              key: `approve-cancel-${order.id}`,
                              label: "Duyệt hủy",
                              onClick: () =>
                                handleApproveCancelRequest(order.id),
                              tone: "warning",
                            },
                            {
                              key: `reject-cancel-${order.id}`,
                              label: "Từ chối hủy",
                              onClick: () =>
                                handleRejectCancelRequest(order.id),
                            },
                          );
                        }

                        if (cancelRequest?.status === "APPROVED") {
                          secondaryActions.push({
                            key: `complete-refund-${order.id}`,
                            label: "Đã hoàn tiền thủ công",
                            onClick: () => handleCompleteManualRefund(order.id),
                            tone: "success",
                          });
                        }

                        secondaryActions.push({
                          key: `cancel-order-${order.id}`,
                          label: "Hủy đơn",
                          onClick: () =>
                            openCancelModal(order.id, order.status),
                          disabled: !canCancel,
                          tone: "danger",
                        });

                        return (
                          <div
                            key={order.id}
                            className="grid cursor-pointer grid-cols-12 border-b border-slate-100 px-6 py-5 transition-colors hover:bg-slate-50/60"
                            onClick={() => openDetailModal(order)}
                          >
                            <div className="col-span-4">
                              <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                                  {first?.imageUrl ? (
                                    <img
                                      src={first.imageUrl}
                                      alt={first.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="text-xs text-slate-500">
                                      Không có ảnh
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {first?.name ?? "(Không có sản phẩm)"}
                                    </p>
                                    {first?.attributesText ? (
                                      <p className="mt-1 text-xs text-slate-600">
                                        {first.attributesText}
                                      </p>
                                    ) : null}
                                    {first ? (
                                      <p className="mt-1 text-xs text-slate-600">
                                        Số lượng: {first.quantity}
                                        {extraCount > 0
                                          ? ` • +${extraCount} sản phẩm khác`
                                          : ""}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                                    <span className="font-semibold text-slate-900">
                                      {order.user.label}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDate(order.createdAt)}</span>
                                    <span>•</span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      {order.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2 flex items-center">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatMoney(order.totalPrice)}
                                </p>
                                {order.items.length > 0 ? (
                                  <p className="mt-1 text-xs text-slate-600">
                                    {order.items.length} sản phẩm
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="col-span-2 flex items-center">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {order.payment.method ?? "—"}
                                </p>
                                <p className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                  {paymentStatusText(
                                    order.payment.status ??
                                      order.payment.transactionStatus,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="col-span-1 flex items-center">
                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                                  order.status,
                                )}`}
                              >
                                {statusText(order.status)}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center justify-end gap-2">
                              {canPrimary && primaryLabel !== "—" ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrimary();
                                  }}
                                  className="whitespace-nowrap rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                  {primaryLabel}
                                </button>
                              ) : null}

                              <RowActionsMenu actions={secondaryActions} />
                            </div>

                            {cancelRequest ? (
                              <div className="col-span-12 mt-3 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-3 text-xs text-orange-900">
                                <p className="font-semibold text-sm">
                                  Yêu cầu hủy:{" "}
                                  {cancelRequestStatusText(
                                    cancelRequest.status,
                                  )}
                                </p>
                                <p className="mt-1">
                                  Lý do:{" "}
                                  {cancelReasonText(cancelRequest.reasonCode)}
                                  {cancelRequest.reasonText
                                    ? ` - ${cancelRequest.reasonText}`
                                    : ""}
                                </p>
                                <p className="mt-1">
                                  Tài khoản nhận hoàn:{" "}
                                  {cancelRequest.bankAccountName} -{" "}
                                  {cancelRequest.bankAccountNumber} -{" "}
                                  {cancelRequest.bankName}
                                </p>
                                <p className="mt-1">
                                  Số tiền cần hoàn tiền:{" "}
                                  {formatMoney(
                                    cancelRefund?.amount ?? order.totalPrice,
                                  )}
                                </p>
                                {cancelRequest.rejectionReason ? (
                                  <p className="mt-1 text-red-700">
                                    Lý do từ chối:{" "}
                                    {cancelRequest.rejectionReason}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {cancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận hủy đơn
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {cancelModal.status === "PAID"
                ? "Đơn đã thanh toán, vui lòng nhập lý do hủy (bắt buộc)."
                : "Nhập lý do hủy đơn (không bắt buộc)."}
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Ví dụ: Khách yêu cầu đổi mẫu khác..."
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelSubmitting ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
          onClick={closeDetailModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Chi tiết đơn hàng
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Mã đơn: {detailModal.id}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Tạo lúc {formatDate(detailModal.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                    detailModal.status,
                  )}`}
                >
                  {statusText(detailModal.status)}
                </span>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Giao hàng
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {detailModal.shipping?.recipient ?? detailModal.user.label}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {detailModal.shipping?.phone ??
                    detailModal.user.phone ??
                    "Khong co so dien thoai"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatShippingAddress(detailModal)}
                </p>
                {detailModal.shipping?.source === "USER_PROFILE_FALLBACK" ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Ghi chu: hien thi theo profile user do chua co dia chi luu
                    cho don.
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thanh toán
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Phương thức: {detailModal.payment.method ?? "—"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Trạng thái: {paymentStatusText(detailModal.payment.status)}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Mã giao dịch: {detailModal.payment.orderCode ?? "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng quan
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Số dòng sản phẩm: {detailModal.items.length}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Tổng tiền: {formatMoney(detailModal.totalPrice)}
                </p>
              </div>
            </div>

            {detailModal.returns?.details?.length ? (
              <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm text-cyan-950">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base">
                      Yêu cầu trả hàng/hoàn tiền
                    </p>
                    <p className="mt-1">
                      SĐT liên hệ:{" "}
                      {detailModal.shipping?.phone ??
                        detailModal.user.phone ??
                        "Không có số điện thoại"}
                    </p>
                    <p className="mt-1">
                      Địa chỉ lấy hàng: {formatShippingAddress(detailModal)}
                    </p>
                  </div>

                  {detailModal.returnStatus === "REQUESTED" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveReturns(detailModal.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Chấp nhận yêu cầu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectReturns(detailModal.id)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Từ chối yêu cầu
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-4">
                  {detailModal.returns.details.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-cyan-100 bg-white/80 p-3"
                    >
                      <div className="grid gap-2 md:grid-cols-2">
                        <p>
                          Lý do:{" "}
                          <span className="font-semibold">
                            {returnReasonText(item.reasonCode)}
                          </span>
                        </p>
                        <p>Trạng thái: {item.status}</p>
                        {item.reason ? (
                          <p className="md:col-span-2">
                            Mô tả thêm: {item.reason}
                          </p>
                        ) : null}
                        <p className="md:col-span-2">
                          Thông tin chuyển khoản:{" "}
                          {item.bankAccountName ?? "—"} -{" "}
                          {item.bankAccountNumber ?? "—"} -{" "}
                          {item.bankName ?? "—"}
                        </p>
                      </div>

                      {item.evidenceImages.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {item.evidenceImages.map((image, index) => (
                            <a
                              key={`${item.id}-${image.url}-${index}`}
                              href={image.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-20 w-20 overflow-hidden rounded-lg border border-cyan-100 bg-white"
                            >
                              <img
                                src={image.url}
                                alt={`Ảnh minh chứng ${index + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                    <th className="px-4 py-3 font-semibold">Đơn giá</th>
                    <th className="px-4 py-3 font-semibold">SL</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {detailModal.items.map((item) => {
                    const lineTotal = toMoneyNumber(item.price) * item.quantity;

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-500">
                                  No img
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.name}
                              </p>
                              {item.attributesText ? (
                                <p className="mt-0.5 text-xs text-slate-600">
                                  {item.attributesText}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatMoney(item.price)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatMoney(String(lineTotal))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {detailModal.cancelRequest ? (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <p className="font-semibold">
                  Yêu cầu hủy:{" "}
                  {cancelRequestStatusText(detailModal.cancelRequest.status)}
                </p>
                <p className="mt-1">
                  Lý do:{" "}
                  {cancelReasonText(detailModal.cancelRequest.reasonCode)}
                  {detailModal.cancelRequest.reasonText
                    ? ` - ${detailModal.cancelRequest.reasonText}`
                    : ""}
                </p>
                <p className="mt-1">
                  Hoàn tiền:{" "}
                  {formatMoney(
                    detailModal.cancelRefund?.amount ?? detailModal.totalPrice,
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
