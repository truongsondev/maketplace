import { Bell, LogOut, Search, X } from "lucide-react";
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

    const diff = Math.max(0, Date.now() - date.getTime());
    const minute = 60_000;
    const hour = minute * 60;
    const day = hour * 24;

    if (diff < minute) return "Vừa xong";
    if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
  };

  const resolveNotificationTarget = (notification: AdminNotificationItem) => {
    const content = notification.content || "";

    // Payment success notification: route to orders page and prefill search by order code.
    const orderCodeMatch = content.match(/Don hang\s*#(\d+)/i);
    if (orderCodeMatch?.[1]) {
      const search = new URLSearchParams({ search: orderCodeMatch[1] });
      return `/orders?${search.toString()}`;
    }

    // Low-stock notification: route to products page, focus low stock list and prefill SKU search when present.
    if (/Canh bao ton kho thap/i.test(content)) {
      const params = new URLSearchParams({ stockStatus: "low" });
      const skuMatch = content.match(/SKU:\s*([^\)\s]+)/i);
      if (skuMatch?.[1]) {
        params.set("search", skuMatch[1]);
      }
      return `/products?${params.toString()}`;
    }

    return "/orders";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {getPageTitle()}
            </h2>
          )}
        </div>

        {!isSearchOpen ? (
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Mở tìm kiếm"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tìm kiếm"
            >
              <Search className="w-6 h-6" />
            </button>

            <div className="relative" ref={notificationPanelRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Thông báo"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="absolute right-0 mt-2 w-90 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Thông báo
                    </h3>
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Đánh dấu đã đọc tất cả
                    </button>
                  </div>

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
                                {notification.content}
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {user ? getInitials(user.fullName) : "A"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.fullName || "Quản trị viên"}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.roles?.join(", ") || "ADMIN"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
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
