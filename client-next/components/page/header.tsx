"use client";

import { ShoppingCart, Search, User, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/use-logout";

interface HeaderProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
  cartCount: number;
}

export function Header({ isDark, onToggleDarkMode, cartCount }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      router.push("/login");
    }
  };
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-6 py-4 lg:px-10 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white font-bold text-lg">
            ◆
          </div>
          <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em]">
            AURA
          </h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          <a
            href="#"
            className="text-sm font-bold text-neutral-800 dark:text-neutral-50 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Trang chủ
          </a>
          <a
            href="#"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Áo
          </a>
          <a
            href="#"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Quần
          </a>
          <a
            href="#"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Phụ kiện
          </a>
          <a
            href="#"
            className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            Khuyến mãi
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAuthAction}
            disabled={isLoggingOut}
            className="hidden lg:flex min-w-21 cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingOut
              ? "Đang xuất…"
              : isAuthenticated
                ? "Đăng xuất"
                : "Đăng nhập"}
          </button>
          <button className="group flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors">
            <Search className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
          </button>
          <button className="group relative flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors">
            <ShoppingCart className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {cartCount}
            </span>
          </button>
          <button className="hidden md:flex group size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors">
            <User className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
          </button>
          <button
            onClick={onToggleDarkMode}
            className="group flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
          >
            {isDark ? (
              <Sun className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
            ) : (
              <Moon className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
            )}
          </button>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4 transition-colors duration-200">
          <nav className="flex flex-col gap-4">
            <a
              href="#"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Trang chủ
            </a>
            <a
              href="#"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Áo
            </a>
            <a
              href="#"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Quần
            </a>
            <a
              href="#"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Phụ kiện
            </a>
            <a href="#" className="text-sm font-medium text-red-500">
              Khuyến mãi
            </a>
            <button
              onClick={handleAuthAction}
              disabled={isLoggingOut}
              className="w-full bg-primary text-white font-semibold py-2 rounded-lg mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut
                ? "Đang xuất…"
                : isAuthenticated
                  ? "Đăng xuất"
                  : "Đăng nhập"}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
