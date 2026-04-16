import { useEffect, useMemo, useState } from "react";
import { Header, Sidebar } from "@/components/admin";
import { userService } from "@/services/api";
import type {
  AdminUserAuditItem,
  AdminUserCustomerCohorts,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserRole,
  AdminUserStatus,
  AdminUserTopSpenders,
} from "@/types/user";
import { toast } from "sonner";

const STATUS_OPTIONS: Array<{ label: string; value: AdminUserStatus | "" }> = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Tạm khóa", value: "SUSPENDED" },
  { label: "Cấm", value: "BANNED" },
];

const ROLE_OPTIONS: Array<{ label: string; value: AdminUserRole | "" }> = [
  { label: "Tất cả vai trò", value: "" },
  { label: "Quản trị viên", value: "ADMIN" },
  { label: "Người mua", value: "BUYER" },
];

function toStatusBadgeClass(status: AdminUserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";
    case "BANNED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Chưa có lần đăng nhập";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUserLabel(input: {
  email: string | null;
  phone: string | null;
  userId?: string;
}) {
  return input.email ?? input.phone ?? input.userId ?? "-";
}

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "">("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastLogin" | "email">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null,
  );
  const [audits, setAudits] = useState<AdminUserAuditItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const analyticsDays = 30;
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [cohorts, setCohorts] = useState<AdminUserCustomerCohorts | null>(null);
  const [topSpenders, setTopSpenders] = useState<AdminUserTopSpenders | null>(
    null,
  );
  const [hoveredCohort, setHoveredCohort] = useState<
    { key: "new" | "returning"; value: number; pct: number } | undefined
  >(undefined);
  const [hoveredSpender, setHoveredSpender] = useState<
    | { userId: string; label: string; totalSpent: number; ordersCount: number }
    | undefined
  >(undefined);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortOrder,
      });

      setItems(response.data.items);
      setTotalPages(response.data.pagination.totalPages || 1);
      setTotalUsers(response.data.pagination.total);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (userId: string) => {
    try {
      setLoadingDetail(true);
      const [detailResponse, auditsResponse] = await Promise.all([
        userService.getUserById(userId),
        userService.getAudits(userId, { page: 1, limit: 20 }),
      ]);
      setSelectedUser(detailResponse.data);
      setAudits(auditsResponse.data.items);
      setDetailOpen(true);
    } catch (error) {
      toast.error("Không thể tải chi tiết người dùng");
      console.error(error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [cohortsRes, topRes] = await Promise.all([
        userService.getCustomerCohorts({ days: analyticsDays }),
        userService.getTopSpenders({ days: analyticsDays, limit: 5 }),
      ]);
      setCohorts(cohortsRes.data);
      setTopSpenders(topRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, statusFilter, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleSearch = () => {
    setPage(1);
    const normalized = searchInput.trim();
    setSearch(normalized || undefined);
  };

  const handleExport = async () => {
    try {
      const blob = await userService.exportUsers({
        search,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortOrder,
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `danh-sách-người-dùng-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể xuất danh sách người dùng");
      console.error(error);
    }
  };

  const handleChangeStatus = async (
    user: AdminUserListItem,
    nextStatus: AdminUserStatus,
  ) => {
    if (user.status === nextStatus) {
      return;
    }

    const reason = window.prompt("Nhập lý do thay đổi trạng thái:");
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await userService.updateStatus(user.id, {
        status: nextStatus,
        reason: reason.trim(),
      });
      toast.success("Cập nhật trạng thái thành công");
      await loadUsers();
      if (selectedUser?.id === user.id) {
        await loadUserDetail(user.id);
      }
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
      console.error(error);
    }
  };

  const handleChangeRole = async (
    user: AdminUserListItem,
    nextRole: AdminUserRole,
  ) => {
    if (user.role === nextRole) {
      return;
    }

    const reason = window.prompt("Nhập lý do thay đổi vai trò:");
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await userService.updateRole(user.id, {
        role: nextRole,
        reason: reason.trim(),
      });
      toast.success("Cập nhật vai trò thành công");
      await loadUsers();
      if (selectedUser?.id === user.id) {
        await loadUserDetail(user.id);
      }
    } catch (error) {
      toast.error("Không thể cập nhật vai trò");
      console.error(error);
    }
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const summaryText = useMemo(() => {
    return `Tổng ${totalUsers} người dùng`;
  }, [totalUsers]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-9xl mx-auto space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Quản lý người dùng
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">{summaryText}</p>
                </div>
                <button
                  onClick={handleExport}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Xuất CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Tìm theo email/số điện thoại/id"
                  className="h-10 rounded-lg border border-gray-300 px-3 md:col-span-2"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(
                      (e.target.value as AdminUserStatus | "") || "",
                    );
                  }}
                  className="h-10 rounded-lg border border-gray-300 px-3"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setPage(1);
                    setRoleFilter((e.target.value as AdminUserRole | "") || "");
                  }}
                  className="h-10 rounded-lg border border-gray-300 px-3"
                >
                  {ROLE_OPTIONS.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSearch}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "createdAt" | "lastLogin" | "email",
                    )
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3"
                >
                  <option value="createdAt">Sắp xếp theo ngày tạo</option>
                  <option value="lastLogin">Sắp xếp theo lần đăng nhập</option>
                  <option value="email">Sắp xếp theo email</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3"
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="relative rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Khách mới vs khách cũ
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {analyticsDays} ngày gần nhất (theo đơn đã thanh toán)
                      </p>
                    </div>
                    {cohorts ? (
                      <p className="text-xs text-gray-600">
                        Tổng:{" "}
                        <span className="font-semibold">
                          {cohorts.customersWithOrders}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  {analyticsLoading ? (
                    <p className="mt-3 text-sm text-gray-600">Đang tải…</p>
                  ) : !cohorts ? (
                    <p className="mt-3 text-sm text-gray-600">
                      Không thể tải thống kê.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {(() => {
                        const total = cohorts.customersWithOrders || 0;
                        const newCustomers = cohorts.newCustomers || 0;
                        const returning = cohorts.returningCustomers || 0;
                        const newPct = total
                          ? Math.round((newCustomers / total) * 100)
                          : 0;
                        const returningPct = total
                          ? Math.round((returning / total) * 100)
                          : 0;

                        return (
                          <>
                            <div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">
                                  Khách mới
                                </span>
                                <span className="text-gray-600">
                                  {newCustomers} ({newPct}%)
                                </span>
                              </div>
                              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-blue-600"
                                  style={{
                                    width: `${total ? (newCustomers / total) * 100 : 0}%`,
                                  }}
                                  onMouseEnter={() =>
                                    setHoveredCohort({
                                      key: "new",
                                      value: newCustomers,
                                      pct: newPct,
                                    })
                                  }
                                  onMouseLeave={() =>
                                    setHoveredCohort(undefined)
                                  }
                                  title={`Khách mới: ${newCustomers} (${newPct}%)`}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">
                                  Khách cũ
                                </span>
                                <span className="text-gray-600">
                                  {returning} ({returningPct}%)
                                </span>
                              </div>
                              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-emerald-600"
                                  style={{
                                    width: `${total ? (returning / total) * 100 : 0}%`,
                                  }}
                                  onMouseEnter={() =>
                                    setHoveredCohort({
                                      key: "returning",
                                      value: returning,
                                      pct: returningPct,
                                    })
                                  }
                                  onMouseLeave={() =>
                                    setHoveredCohort(undefined)
                                  }
                                  title={`Khách cũ: ${returning} (${returningPct}%)`}
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {hoveredCohort ? (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                      <p className="font-semibold text-gray-900">
                        {hoveredCohort.key === "new" ? "Khách mới" : "Khách cũ"}
                      </p>
                      <p className="mt-0.5">
                        Số lượng:{" "}
                        <span className="font-semibold">
                          {hoveredCohort.value}
                        </span>
                      </p>
                      <p>
                        Tỉ lệ:{" "}
                        <span className="font-semibold">
                          {hoveredCohort.pct}%
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="relative rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Top khách chi tiêu nhiều
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {analyticsDays} ngày gần nhất (đơn đã thanh toán)
                      </p>
                    </div>
                  </div>

                  {analyticsLoading ? (
                    <p className="mt-3 text-sm text-gray-600">Đang tải…</p>
                  ) : !topSpenders ? (
                    <p className="mt-3 text-sm text-gray-600">
                      Không thể tải thống kê.
                    </p>
                  ) : topSpenders.items.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">
                      Chưa có dữ liệu.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {(() => {
                        const max = Math.max(
                          ...topSpenders.items.map((i) => i.totalSpent),
                          1,
                        );
                        return topSpenders.items.map((item) => {
                          const label = formatUserLabel({
                            email: item.email,
                            phone: item.phone,
                            userId: item.userId,
                          });
                          const pct = (item.totalSpent / max) * 100;
                          return (
                            <div key={item.userId} className="space-y-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="truncate font-semibold text-gray-700">
                                  {label}
                                </span>
                                <span className="whitespace-nowrap text-gray-600">
                                  {formatCurrency(item.totalSpent)}
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-indigo-600"
                                  style={{ width: `${pct}%` }}
                                  onMouseEnter={() =>
                                    setHoveredSpender({
                                      userId: item.userId,
                                      label,
                                      totalSpent: item.totalSpent,
                                      ordersCount: item.ordersCount,
                                    })
                                  }
                                  onMouseLeave={() =>
                                    setHoveredSpender(undefined)
                                  }
                                  title={`${label}: ${formatCurrency(item.totalSpent)} (${item.ordersCount} đơn)`}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {hoveredSpender ? (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                      <p className="max-w-65 truncate font-semibold text-gray-900">
                        {hoveredSpender.label}
                      </p>
                      <p className="mt-0.5">
                        Chi tiêu:{" "}
                        <span className="font-semibold">
                          {formatCurrency(hoveredSpender.totalSpent)}
                        </span>
                      </p>
                      <p>
                        Số đơn:{" "}
                        <span className="font-semibold">
                          {hoveredSpender.ordersCount}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-250 text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Số điện thoại</th>
                      <th className="px-3 py-2">Vai trò</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Xác thực email</th>
                      <th className="px-3 py-2">Lần đăng nhập gần nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4">
                          Đang tải người dùng...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4">
                          Không có người dùng phù hợp.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.id}
                          className={`border-t border-gray-100 align-top cursor-pointer transition-colors hover:bg-blue-50/50 ${
                            selectedUser?.id === item.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => loadUserDetail(item.id)}
                          title="Nhấn vào dòng để xem chi tiết"
                        >
                          <td className="px-3 py-2">{item.email || "-"}</td>
                          <td className="px-3 py-2">{item.phone || "-"}</td>
                          <td className="px-3 py-2">{item.role}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${toStatusBadgeClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {item.emailVerified ? "Có" : "Không"}
                          </td>
                          <td className="px-3 py-2">
                            {formatDate(item.lastLogin)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => canGoPrev && setPage((prev) => prev - 1)}
                  disabled={!canGoPrev}
                  className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {page}/{totalPages}
                </span>
                <button
                  onClick={() => canGoNext && setPage((prev) => prev + 1)}
                  disabled={!canGoNext}
                  className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chi tiết người dùng
                </h2>
                {detailOpen && (
                  <button
                    onClick={() => {
                      setDetailOpen(false);
                      setSelectedUser(null);
                      setAudits([]);
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Đóng chi tiết
                  </button>
                )}
              </div>
              {loadingDetail ? (
                <p className="mt-3 text-sm text-gray-600">
                  Đang tải chi tiết...
                </p>
              ) : !selectedUser || !detailOpen ? (
                <p className="mt-3 text-sm text-gray-600">
                  Nhấn vào bất kỳ dòng dữ liệu nào trong bảng để xem chi tiết
                  người dùng.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedUser.email || "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Vai trò</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedUser.role === "ADMIN"
                          ? "Quản trị viên"
                          : "Người mua"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Trạng thái</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedUser.status}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedUser.addressesCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Đơn hàng</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedUser.ordersCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatCurrency(selectedUser.totalSpent)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Thao tác quản trị
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          handleChangeStatus(
                            selectedUser,
                            selectedUser.status === "ACTIVE"
                              ? "SUSPENDED"
                              : "ACTIVE",
                          )
                        }
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {selectedUser.status === "ACTIVE"
                          ? "Tạm khóa"
                          : "Kích hoạt"}
                      </button>
                      <button
                        onClick={() =>
                          handleChangeStatus(selectedUser, "BANNED")
                        }
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Cấm tài khoản
                      </button>
                      <button
                        onClick={() =>
                          handleChangeRole(
                            selectedUser,
                            selectedUser.role === "ADMIN" ? "BUYER" : "ADMIN",
                          )
                        }
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {selectedUser.role === "ADMIN"
                          ? "Chuyển thành Người mua"
                          : "Chuyển thành Quản trị viên"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Audit gần đây
                    </h3>
                    <div className="mt-2 space-y-2">
                      {audits.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          Chưa có audit log.
                        </p>
                      ) : (
                        audits.map((audit) => (
                          <div
                            key={audit.id}
                            className="rounded-lg border border-gray-200 p-3 text-sm"
                          >
                            <p className="font-medium text-gray-900">
                              {audit.action}
                            </p>
                            <p className="text-gray-600 mt-1">
                              {audit.reason || "Không có lý do"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(audit.createdAt)} - Tác nhân:{" "}
                              {audit.actorAdminId || "-"}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
