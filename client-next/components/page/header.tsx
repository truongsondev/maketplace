"use client";

import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [storedUserLabel, setStoredUserLabel] = useState("");
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem("auth-session");

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as {
        state?: {
          user?: { email?: string | null } | null;
          profile?: { fullName?: string | null } | null;
        };
      };

      const localName = parsed.state?.profile?.fullName?.trim();
      const localEmail = parsed.state?.user?.email?.trim();

      setStoredUserLabel(localName || localEmail || "");
    } catch {
      setStoredUserLabel("");
    }
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const userLabel = useMemo(() => {
    const profileName = profile?.fullName?.trim();
    const userEmail = user?.email?.trim();
    return profileName || userEmail || storedUserLabel || "Tài khoản";
  }, [profile?.fullName, storedUserLabel, user?.email]);

  const handleNavigate = (path: string) => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    router.push(path);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      setIsUserMenuOpen(false);
      logout();
    } else {
      router.push("/login");
    }
  };
  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-6 py-4 lg:px-10 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-linear-to-br from-primary to-orange-400 text-white shadow-lg shadow-primary/30">
            <Sparkles className="size-6" />
          </div>
          <Link
            href="/"
            className="text-2xl font-bold leading-tight tracking-[-0.015em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
          >
            AURA
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center gap-8">
          <Link
            href="/"
            className="text-sm font-bold text-neutral-800 dark:text-neutral-50 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/#products"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Áo
          </Link>
          <Link
            href="/#products"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Quần
          </Link>
          <Link
            href="/#categories"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Phụ kiện
          </Link>
          <Link
            href="/#sale"
            className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            Khuyến mãi
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-label="Mở menu tài khoản"
                aria-expanded={isUserMenuOpen}
                aria-controls="desktop-user-menu"
                className="group flex h-10 max-w-56 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:border-primary hover:text-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <User className="size-4" />
                </span>
                <span className="truncate">{userLabel}</span>
                <ChevronDown
                  className={`size-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  id="desktop-user-menu"
                  className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <button
                    onClick={() => handleNavigate("/cart")}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ShoppingCart className="size-4" />
                    Giỏ hàng
                  </button>
                  <button
                    onClick={() => handleNavigate("/profile")}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <User className="size-4" />
                    Hồ sơ
                  </button>
                  <button
                    onClick={handleAuthAction}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/40"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleAuthAction}
              disabled={isLoggingOut}
              className="hidden lg:flex min-w-21 cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Đang xuất…" : "Đăng nhập"}
            </button>
          )}
          <button
            aria-label="Tìm kiếm sản phẩm"
            onClick={() => router.push("/#products")}
            className="group flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
          </button>
          <button
            aria-label="Mở giỏ hàng"
            onClick={() => router.push("/cart")}
            className="group relative flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShoppingCart className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          {!isAuthenticated && (
            <button
              aria-label="Đăng nhập"
              onClick={handleAuthAction}
              className="hidden md:flex group size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <User className="size-5 text-neutral-800 dark:text-neutral-50 group-hover:text-primary" />
            </button>
          )}
          <button
            onClick={onToggleDarkMode}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="group flex size-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            aria-label={isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-main-menu"
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div
          id="mobile-main-menu"
          className="md:hidden border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4 transition-colors duration-200"
        >
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Trang chủ
            </Link>
            <Link
              href="/#products"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Áo
            </Link>
            <Link
              href="/#products"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Quần
            </Link>
            <Link
              href="/#categories"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Phụ kiện
            </Link>
            <Link
              href="/#sale"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-red-500"
            >
              Khuyến mãi
            </Link>
            {isAuthenticated ? (
              <div className="mt-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-label="Mở menu tài khoản"
                  aria-expanded={isUserMenuOpen}
                  aria-controls="mobile-user-menu"
                  className="flex w-full items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-100"
                >
                  <span className="truncate">{userLabel}</span>
                  <ChevronDown
                    className={`size-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div id="mobile-user-menu" className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={() => handleNavigate("/cart")}
                      className="w-full rounded-md bg-neutral-100 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Giỏ hàng
                    </button>
                    <button
                      onClick={() => handleNavigate("/profile")}
                      className="w-full rounded-md bg-neutral-100 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={handleAuthAction}
                      disabled={isLoggingOut}
                      className="w-full rounded-md bg-red-50 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/40"
                    >
                      {isLoggingOut ? "Đang xuất…" : "Đăng xuất"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthAction}
                disabled={isLoggingOut}
                className="w-full bg-primary text-white font-semibold py-2 rounded-lg mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "Đang xuất…" : "Đăng nhập"}
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
