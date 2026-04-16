import { Header, Sidebar } from "@/components/admin";
import { logsService } from "@/services/api";
import type { AdminLogItem, AuditActorType } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  const [items, setItems] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actorType, setActorType] = useState<AuditActorType | "ALL">("USER");
  const [actionQuery, setActionQuery] = useState("");

  const params = useMemo(() => {
    return {
      page,
      limit,
      actorType: actorType === "ALL" ? undefined : actorType,
      action: actionQuery.trim() ? actionQuery.trim() : undefined,
    };
  }, [page, limit, actorType, actionQuery]);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
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

          <div className="mt-4 bg-white rounded-lg shadow-sm border overflow-x-auto">
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
                          <div className="text-xs text-gray-600 whitespace-normal break-all max-w-[520px]">
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

          <div className="mt-4 flex items-center justify-between">
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
        </main>
      </div>
    </div>
  );
}
