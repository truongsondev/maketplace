import { Bell, LogOut, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    if (path === "/dashboard") return "Bảng điều khiển";
    if (path.startsWith("/products")) return "Sản phẩm";
    if (path === "/orders") return "Đơn hàng";
    if (path === "/users") return "Người dùng";
    if (path === "/logs") return "Nhật ký";
    if (path === "/voucher") return "Mã giảm giá";
    if (path === "/banner") return "Biểu ngữ";
    if (path === "/events") return "Sự kiện";
    return "Aura";
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

            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
