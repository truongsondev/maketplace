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
import { logsService } from "@/services/api";
import type { AdminLogItem, AuditActorType } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveDateRange, type DateRangeValue } from "@/lib/date-range";
import { AlertOctagon, DatabaseZap, KeyRound, RadioTower } from "lucide-react";

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

function previewJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  try {
    const json = JSON.stringify(value);
    if (json.length <= 180) return json;
    return `${json.slice(0, 180)}…`;
  } catch {
    return String(value);
  }
}

function mapActorTypeLabel(type: AuditActorType): string {
  switch (type) {
    case "USER":
      return "Người dùng";
    case "ADMIN":
      return "Quản trị";
    case "SYSTEM":
      return "Hệ thống";
    default:
      return type;
  }
}

function mapTargetTypeLabel(targetType?: string | null): string {
  if (!targetType) return "";
  switch (targetType) {
    case "Order":
      return "Đơn hàng";
    case "PaymentTransaction":
      return "Giao dịch thanh toán";
    case "User":
      return "Người dùng";
    case "Product":
      return "Sản phẩm";
    default:
      return targetType;
  }
}

function mapActionLabel(action: string): string {
  switch (action) {
    case "USER_CHECKOUT_CREATED":
      return "Người dùng tạo yêu cầu thanh toán";
    case "USER_PAYMENT_LINK_FAILED":
      return "Tạo link thanh toán thất bại";
    case "USER_PAYMENT_PAID":
      return "Thanh toán thành công";
    case "USER_PAYMENT_EXPIRED":
      return "Thanh toán hết hạn";
    case "USER_PAYMENT_FAILED":
      return "Thanh toán thất bại";
    case "USER_ORDER_CANCELLED":
      return "Người dùng hủy đơn";
    case "USER_ORDER_CANCEL_REQUESTED":
      return "Người dùng yêu cầu hủy đơn";
    case "USER_ORDER_RECEIVED_CONFIRMED":
      return "Người dùng xác nhận đã nhận hàng";
    case "USER_ORDER_RETURN_REQUESTED":
      return "Người dùng yêu cầu trả hàng";
    default:
      return action;
  }
}

export default function LogsPage() {
  const [range, setRange] = useState<DateRangeValue>({
    option: "30d",
    from: "",
    to: "",
  });
  const rangeInfo = resolveDateRange(range);
  const [items, setItems] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actorType, setActorType] = useState<AuditActorType | "ALL">("USER");
  const [actionQuery, setActionQuery] = useState("");

  const params = useMemo(() => {
    const isAllRange = range.option === "all";
    return {
      page,
      limit,
      actorType: actorType === "ALL" ? undefined : actorType,
      action: actionQuery.trim() ? actionQuery.trim() : undefined,
      from: isAllRange ? undefined : rangeInfo.from,
      to: isAllRange ? undefined : rangeInfo.to,
    };
  }, [
    page,
    limit,
    actorType,
    actionQuery,
    rangeInfo.from,
    rangeInfo.to,
    range.option,
  ]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await logsService.getLogs(params);
      setItems(response.data.items);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch {
      toast.error("Không tải được nhật ký");
      setItems([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [rangeInfo.from, rangeInfo.to, range.option]);

  const criticalLogs = items.filter((log) =>
    /FAILED|ERROR|EXPIRED|REJECTED|CANCEL|RETURN/i.test(log.action),
  );
  const paymentIssues = items.filter((log) => /PAYMENT/i.test(log.action)).length;
  const authIssues = items.filter((log) => /LOGIN|AUTH|TOKEN/i.test(log.action)).length;
  const inventoryIssues = items.filter((log) => /STOCK|INVENTORY|PRODUCT/i.test(log.action)).length;
  const apiFailures = items.filter((log) => /FAILED|ERROR/i.test(log.action)).length;
  const severityMax = Math.max(paymentIssues, authIssues, inventoryIssues, apiFailures, 1);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="min-w-0 p-6 lg:p-8">
          <div className="mx-auto max-w-375 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfeff,#fff_34%,#f8fafc)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                    Giám sát vận hành
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">
                    Giám sát vận hành
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Nhật ký được nhóm theo severity và domain để critical event nổi bật, sticky và actionable.
                  </p>
                </div>
                <LivePill label="Luồng nhật ký" />
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <OpsCard className="border-rose-200 bg-gradient-to-br from-white to-rose-50">
                <SectionHeading
                  title="Sự kiện nghiêm trọng"
                  description="Các event failure/cancel/return nên được xử lý như alert, không lẫn trong log thường."
                />
                <div className="grid gap-3">
                  <AlertItem
                    tone={criticalLogs.length > 0 ? "danger" : "good"}
                    icon={AlertOctagon}
                    title={`${criticalLogs.length} sự kiện nghiêm trọng/cảnh báo`}
                    description="Thất bại, lỗi, hết hạn, bị từ chối, hủy hoặc trả hàng được gom thành hàng đợi rủi ro."
                    action="Xem log bên dưới"
                  />
                  <InsightCard
                    tone="warning"
                    priority="Ghim nổi bật"
                    metric="Nghiêm trọng"
                    title="Critical event cần sticky/highlight"
                    description="Bảng phía dưới vẫn giữ toàn bộ audit trail, nhưng critical summary giúp admin không bỏ sót."
                  />
                </div>
              </OpsCard>

              <OpsCard>
                <SectionHeading title="Issue Grouping" description="Nhóm theo domain vận hành để drill-down nhanh." />
                <div className="space-y-4">
                  <MetricBar label="Vấn đề thanh toán" value={paymentIssues} max={severityMax} tone="danger" detail={`${paymentIssues}`} />
                  <MetricBar label="Vấn đề xác thực" value={authIssues} max={severityMax} tone="warning" detail={`${authIssues}`} />
                  <MetricBar label="Tồn kho/API sản phẩm" value={inventoryIssues} max={severityMax} tone="info" detail={`${inventoryIssues}`} />
                  <MetricBar label="API thất bại" value={apiFailures} max={severityMax} tone="danger" detail={`${apiFailures}`} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <AlertItem tone="info" icon={RadioTower} title="Thanh toán" description="Webhook, thử lại và hết hạn." action="Lọc" />
                  <AlertItem tone="warning" icon={KeyRound} title="Xác thực" description="Đăng nhập/token/bảo mật." action="Lọc" />
                  <AlertItem tone="info" icon={DatabaseZap} title="Tồn kho" description="Tồn kho/sản phẩm/API." action="Lọc" />
                </div>
              </OpsCard>
            </section>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tác nhân</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={actorType}
                    onChange={(e) => {
                      setPage(1);
                      setActorType(e.target.value as AuditActorType | "ALL");
                    }}
                  >
                    <option value="USER">Người dùng</option>
                    <option value="ADMIN">Quản trị</option>
                    <option value="SYSTEM">Hệ thống</option>
                    <option value="ALL">Tất cả</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hành động</span>
                  <input
                    className="border rounded px-2 py-1 text-sm w-full md:w-64"
                    placeholder="Tìm hành động…"
                    value={actionQuery}
                    onChange={(e) => {
                      setPage(1);
                      setActionQuery(e.target.value);
                    }}
                  />
                </div>

                <DateRangeFilter value={range} onChange={setRange} />
              </div>

              <button
                className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
                onClick={fetchLogs}
                disabled={loading}
              >
                Làm mới
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">Tổng: {total}</div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
            {loading ? (
              <div className="p-6 text-gray-600">Đang tải nhật ký…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-gray-600">Chưa có nhật ký.</div>
            ) : (
              <table className="min-w-full w-full table-fixed text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Thời gian</th>
                    <th className="text-left px-4 py-3">Tác nhân</th>
                    <th className="text-left px-4 py-3">Hành động</th>
                    <th className="text-left px-4 py-3">Đối tượng</th>
                    <th className="text-left px-4 py-3">Dữ liệu</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log) => {
                    const actor =
                      log.actorEmail ||
                      log.actorId ||
                      (log.actorType === "SYSTEM" ? "Hệ thống" : "-");

                    const targetTypeLabel = mapTargetTypeLabel(log.targetType);
                    const target =
                      targetTypeLabel && (log.targetLabel || log.targetId)
                        ? `${targetTypeLabel}: ${log.targetLabel || log.targetId}`
                        : targetTypeLabel || "-";

                    return (
                      <tr key={log.id} className="border-t">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 mr-2">
                            {mapActorTypeLabel(log.actorType)}
                          </span>
                          {actor}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {mapActionLabel(log.action)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {target}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-600 whitespace-normal break-all max-w-130">
                            {previewJson(log.newData) ||
                              previewJson(log.oldData) ||
                              "-"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="border rounded px-3 py-1 text-sm disabled:opacity-50"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>

            <div className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </div>

            <button
              className="border rounded px-3 py-1 text-sm disabled:opacity-50"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
