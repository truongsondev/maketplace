import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Wallet,
  Ticket,
  Calendar,
  Sparkles,
  Image,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Tổng quan", to: "/dashboard" },
    { icon: Package, label: "Sản phẩm", to: "/products" },
    { icon: ShoppingCart, label: "Đơn hàng", to: "/orders" },
    { icon: Users, label: "Người dùng", to: "/users" },
    { icon: Wallet, label: "Hoàn tiền", to: "/refunds" },
    { icon: FileText, label: "Nhật ký", to: "/logs" },
    { icon: Ticket, label: "Mã giảm giá", to: "/voucher" },
    { icon: Image, label: "Biểu ngữ", to: "/banner" },
    { icon: Calendar, label: "Sự kiện", to: "/events" },
  ];

  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="size-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Aura</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === "/products" &&
                location.pathname.startsWith("/products"));
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
