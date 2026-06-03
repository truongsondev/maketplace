import {
  Bell,
  LogOut,
  Search,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import type { AdminNotificationItem } from "@/types/notification";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: notificationsLoading,
    soundEnabled,
    soundNeedsInteraction,
    enableSound,
    disableSound,
  } = useAdminNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchKeyword("");
  };

  useEffect(() => {
    if (!isSearchOpen) return;

    const handle = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen]);

  const getInitials = (fullName?: string) => {
    if (!fullName) return "A";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Tổng quan";
    if (path.startsWith("/products")) return "Sản phẩm";
    if (path === "/orders") return "Đơn hàng";
    if (path === "/users") return "Người dùng";
    if (path === "/logs") return "Nhật ký";
    if (path === "/voucher") return "Mã giảm giá";
    if (path === "/banner") return "Biểu ngữ";
    if (path === "/events") return "Sự kiện";
    return "Aura";
  };

  const formatRelativeTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Vừa xong";
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveNotificationTarget = (notification: AdminNotificationItem) => {
    const content = notification.content || "";

    const returnMatch = content.match(/\[ORDER_RETURN\|([^\]]+)\]/i);
    if (returnMatch?.[1]) {
      const search = new URLSearchParams({ orderId: returnMatch[1] });
      return `/orders?${search.toString()}`;
    }

    const newOrderMatch = content.match(/\[NEW_ORDER\|([^\]]+)\]/i);
    if (newOrderMatch?.[1]) {
      const orderCodeMatch = content.match(/(?:Đơn hàng mới|Don hang moi)\s*#(\d+)/i);
      if (orderCodeMatch?.[1]) {
        const search = new URLSearchParams({ search: orderCodeMatch[1] });
        return `/orders?${search.toString()}`;
      }

      const search = new URLSearchParams({ orderId: newOrderMatch[1] });
      return `/orders?${search.toString()}`;
    }

    // Payment success notification: route to orders page and prefill search by order code.
    const orderCodeMatch = content.match(/(?:Đơn hàng|Don hang)\s*#(\d+)/i);
    if (orderCodeMatch?.[1]) {
      const search = new URLSearchParams({ search: orderCodeMatch[1] });
      return `/orders?${search.toString()}`;
    }

    // Low-stock notification: route to products page, focus low stock list and prefill SKU search when present.
    if (/(?:Cảnh báo tồn kho thấp|Canh bao ton kho thap)/i.test(content)) {
      const params = new URLSearchParams({ stockStatus: "low" });
      const skuMatch = content.match(/SKU:\s*([^\s)]+)/i);
      if (skuMatch?.[1]) {
        params.set("search", skuMatch[1]);
      }
      return `/products?${params.toString()}`;
    }

    return "/orders";
  };

  const displayNotificationContent = (content: string) =>
    content.replace(/^\[(ORDER_RETURN|NEW_ORDER)\|([^\]]+)\]\s*/, "");

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-6">
        <div className="flex-1 min-w-0">
          {isSearchOpen ? (
            <div className="flex items-center gap-3">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative flex-1"
              >
                <input
                  ref={searchInputRef}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm"
                  className="h-11 w-full rounded-sm border border-gray-300 bg-white px-4 pr-11 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
                <button
                  type="submit"
                  aria-label="Tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Đóng tìm kiếm"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-950">
                {getPageTitle()}
              </h2>
            </div>
          )}
        </div>

        {!isSearchOpen ? (
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Mở tìm kiếm"
              className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
              title="Tìm kiếm"
            >
              <Search className="w-6 h-6" />
            </button>

            <div className="relative" ref={notificationPanelRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
                title="Thông báo"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-90 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Thông báo
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          soundEnabled ? disableSound() : void enableSound()
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          soundEnabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                        title={
                          soundEnabled
                            ? "Tắt âm thanh thông báo đơn mới"
                            : "Bật âm thanh thông báo đơn mới"
                        }
                      >
                        {soundEnabled ? (
                          <Volume2 className="size-3.5" />
                        ) : (
                          <VolumeX className="size-3.5" />
                        )}
                        {soundEnabled ? "Âm thanh bật" : "Âm thanh tắt"}
                      </button>
                      <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Đánh dấu đã đọc tất cả
                      </button>
                    </div>
                  </div>

                  {soundEnabled && soundNeedsInteraction ? (
                    <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-medium text-amber-800">
                        Trình duyệt đang chặn autoplay. Bấm nút dưới đây một lần
                        để bật âm thanh thông báo đơn hàng mới.
                      </p>
                      <button
                        type="button"
                        onClick={() => void enableSound()}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        <Volume2 className="size-3.5" />
                        Bật âm thanh
                      </button>
                    </div>
                  ) : null}

                  <div className="max-h-95 overflow-auto">
                    {notificationsLoading ? (
                      <p className="px-4 py-5 text-sm text-gray-500">
                        Đang tải...
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-5 text-sm text-gray-500">
                        Chưa có thông báo nào.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <li key={notification.id} className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (!notification.isRead) {
                                  void markAsRead(notification.id);
                                }
                                setIsNotificationsOpen(false);
                                navigate(
                                  resolveNotificationTarget(notification),
                                );
                              }}
                              className="w-full text-left"
                            >
                              <p
                                className={`text-sm ${
                                  notification.isRead
                                    ? "text-gray-600"
                                    : "text-gray-900 font-semibold"
                                }`}
                              >
                                {displayNotificationContent(
                                  notification.content,
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatRelativeTime(notification.createdAt)}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                {user ? getInitials(user.fullName) : "A"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {user?.fullName || "Quản trị viên"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.roles?.join(", ") || "ADMIN"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 rounded-xl p-2 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
