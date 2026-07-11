import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Wallet,
  Ticket,
  BadgePercent,
  Sparkles,
  Image,
  Store,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Tổng quan", to: "/dashboard" },
    { icon: Package, label: "Sản phẩm", to: "/products" },
    { icon: ShoppingCart, label: "Đơn hàng", to: "/orders" },
    { icon: Store, label: "Bán tại cửa hàng", to: "/physical-sales" },
    { icon: Users, label: "Người dùng", to: "/users" },
    { icon: Wallet, label: "Hoàn tiền", to: "/refunds" },
    { icon: FileText, label: "Nhật ký", to: "/logs" },
    { icon: Ticket, label: "Mã giảm giá", to: "/voucher" },
    { icon: BadgePercent, label: "Sự kiện", to: "/promotions" },
    { icon: Wallet, label: "Hạng thành viên", to: "/loyalty" },
    { icon: Image, label: "Biểu ngữ", to: "/banner" },
  ];

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-950 text-white">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Aura</h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200">
              Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="px-4 py-6">
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
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
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
