import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: Package, label: "Products", to: "/products" },
    { icon: FolderOpen, label: "Categories", to: "/categories" },
    { icon: ShoppingCart, label: "Orders", to: "/orders" },
    { icon: Users, label: "Customers", to: "/customers" },
  ];

  const systemItems = [
    { icon: Settings, label: "Settings", to: "/settings" },
    { icon: LogOut, label: "Logout", to: "/logout" },
  ];

  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-600">E-commerce Manager</p>
      </div>

      {/* Main Menu */}
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

      {/* System Menu */}
      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-3 px-4 uppercase">
          System
        </p>
        <div className="space-y-1">
          {systemItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
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
      </div>
    </aside>
  );
}
