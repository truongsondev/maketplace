"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Loader2,
  Menu,
  Moon,
  ReceiptText,
  Search,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useLogout } from "@/hooks/use-logout";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";

function normalizeEmail(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "object" && value) {
    const maybeValue = (value as { value?: unknown }).value;
    if (typeof maybeValue === "string") {
      const trimmed = maybeValue.trim();
      return trimmed ? trimmed : null;
    }
  }

  return null;
}

function getEmailFromAuthUser(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const anyUser = user as Record<string, unknown>;

  return (
    normalizeEmail(anyUser.email) ||
    normalizeEmail((anyUser.email as { value?: unknown } | undefined)?.value) ||
    normalizeEmail(anyUser._email) ||
    normalizeEmail((anyUser._email as { value?: unknown } | undefined)?.value)
  );
}

interface HeaderProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
  cartCount: number;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80";

function normalizeProductImageUrl(rawUrl: string | null) {
  if (!rawUrl) return FALLBACK_IMAGE;

  const trimmed = rawUrl.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  const absoluteUrl = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  if (
    absoluteUrl.includes("res.cloudinary.com") &&
    absoluteUrl.includes("/upload/")
  ) {
    return absoluteUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_220,h_300/",
    );
  }

  if (
    absoluteUrl.includes("images.unsplash.com") &&
    !absoluteUrl.includes("w=")
  ) {
    return `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}auto=format&fit=crop&w=900&q=80`;
  }

  return absoluteUrl;
}

export function Header({ isDark, onToggleDarkMode, cartCount }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeRootCategoryId, setActiveRootCategoryId] = useState<
    string | null
  >(null);
  const [storedUserLabel, setStoredUserLabel] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const storeIntroPath = "/store";
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const { data: categories = [] } = useCategories(false);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, typeof categories>();
    categories.forEach((c) => {
      const parentKey = c.parentId ?? "__root__";
      const list = map.get(parentKey) ?? [];
      list.push(c);
      map.set(parentKey, list);
    });

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
      map.set(key, list);
    }

    return map;
  }, [categories]);

  const rootCategories = useMemo(() => {
    return (childrenByParentId.get("__root__") ?? []).filter(
      (category) => category.slug !== "cua-hang",
    );
  }, [childrenByParentId]);

  const activeRoot = useMemo(() => {
    if (!activeRootCategoryId) return null;
    return rootCategories.find((c) => c.id === activeRootCategoryId) ?? null;
  }, [activeRootCategoryId, rootCategories]);

  const activeGroups = useMemo(() => {
    if (!activeRoot) return [];
    return childrenByParentId.get(activeRoot.id) ?? [];
  }, [activeRoot, childrenByParentId]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchKeyword("");
    setDebouncedSearchKeyword("");
  };

  useEffect(() => {
    if (!isSearchOpen) return;

    const trimmed = searchKeyword.trim();
    const handle = window.setTimeout(() => {
      setDebouncedSearchKeyword(trimmed);
    }, 280);

    return () => window.clearTimeout(handle);
  }, [isSearchOpen, searchKeyword]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handle = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [isSearchOpen]);

  const {
    data: headerSearchData,
    isFetching: isHeaderSearching,
    isError: isHeaderSearchError,
  } = useQuery({
    queryKey: ["products", "header-search", debouncedSearchKeyword],
    queryFn: () =>
      productService.getProducts({
        q: debouncedSearchKeyword,
        sort: "createdAt:desc",
        limit: 6,
        page: 1,
      }),
    enabled: isSearchOpen && debouncedSearchKeyword.length >= 2,
    staleTime: 1000 * 15,
    retry: false,
  });

  const headerSearchProducts = useMemo(() => {
    return headerSearchData?.products ?? [];
  }, [headerSearchData?.products]);

  const headerSuggestions = useMemo(() => {
    const keyword = (debouncedSearchKeyword || searchKeyword).trim();
    const normalizedKeyword = keyword.toLowerCase();

    const suggestions: string[] = [];
    const seen = new Set<string>();

    if (keyword) {
      suggestions.push(keyword);
      seen.add(normalizedKeyword);
    }

    for (const product of headerSearchProducts) {
      const label = product.name.split(" ").slice(0, 2).join(" ").trim();
      if (!label) continue;

      const key = label.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      suggestions.push(label);

      if (suggestions.length >= 6) break;
    }

    return suggestions;
  }, [debouncedSearchKeyword, headerSearchProducts, searchKeyword]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchKeyword("");
        setDebouncedSearchKeyword("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isSearchOpen]);

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
          user?: unknown;
          profile?: { fullName?: string | null } | null;
        };
      };

      const localName = parsed.state?.profile?.fullName?.trim();
      const localEmail = getEmailFromAuthUser(parsed.state?.user);

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
        setActiveRootCategoryId(null);
        setIsSearchOpen(false);
        setSearchKeyword("");
        setDebouncedSearchKeyword("");
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
    const userEmail = getEmailFromAuthUser(user);

    // Ưu tiên hiện tên, nếu không có thì hiện email. Nếu vẫn không có, dùng dữ liệu từ localStorage.
    return profileName || userEmail || storedUserLabel || "Tài khoản";
  }, [profile?.fullName, storedUserLabel, user]);

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
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-6 py-4 backdrop-blur-md transition-colors duration-200 dark:border-neutral-700 dark:bg-neutral-900/90 lg:px-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-2xl font-black leading-tight tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded"
          >
            AURA
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center">
          <div
            className="relative"
            onMouseLeave={() => setActiveRootCategoryId(null)}
          >
            <div className="flex justify-center gap-8">
              <Link
                href="/"
                className="text-sm font-semibold text-neutral-800 dark:text-neutral-50 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href="/#new-arrivals"
                className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Mới nhất
              </Link>
              {rootCategories.map((category) => {
                const hasChildren =
                  (childrenByParentId.get(category.id) ?? []).length > 0;

                return (
                  <Link
                    key={category.id}
                    href={`/collection/${category.slug}`}
                    onMouseEnter={() => {
                      if (hasChildren) {
                        setActiveRootCategoryId(category.id);
                      } else {
                        setActiveRootCategoryId(null);
                      }
                    }}
                    className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {category.name}
                      {hasChildren ? (
                        <ChevronDown
                          className={`size-4 transition-transform ${activeRootCategoryId === category.id ? "rotate-180" : ""}`}
                        />
                      ) : null}
                    </span>
                  </Link>
                );
              })}

              <Link
                href={storeIntroPath}
                onMouseEnter={() => setActiveRootCategoryId(null)}
                className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Store
              </Link>
            </div>

            {activeRoot && activeGroups.length > 0 ? (
              <div className="absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 border-b border-neutral-200 bg-white/95 pt-4 backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95">
                <div className="mx-auto w-full max-w-330 px-6 py-6 lg:px-10">
                  <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {activeGroups.map((group) => {
                      const items = childrenByParentId.get(group.id) ?? [];
                      return (
                        <div key={group.id} className="min-w-0">
                          <Link
                            href={`/collection/${group.slug}`}
                            className="block text-sm font-bold uppercase tracking-wide text-neutral-900 hover:text-primary dark:text-neutral-50 dark:hover:text-primary"
                          >
                            {group.name}
                          </Link>

                          {items.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/collection/${item.slug}`}
                                  className="block truncate text-sm text-neutral-700 hover:text-primary dark:text-neutral-200 dark:hover:text-primary"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-label="Mở menu tài khoản"
                aria-expanded={isUserMenuOpen}
                aria-controls="desktop-user-menu"
                className={`group flex h-10 max-w-64 items-center gap-2 rounded-full border bg-white px-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-neutral-800 ${
                  isUserMenuOpen
                    ? "border-primary text-primary"
                    : "border-neutral-200 text-neutral-700 hover:border-primary hover:text-primary dark:border-neutral-700 dark:text-neutral-100"
                }`}
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
                  className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <div className="px-4 pb-3 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Tài khoản
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {userLabel}
                    </p>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800" />

                  <button
                    onClick={() => handleNavigate("/cart")}
                    className="mx-2 my-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ShoppingCart className="size-4" />
                    Giỏ hàng
                  </button>
                  <button
                    onClick={() => handleNavigate("/orders")}
                    className="mx-2 my-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ReceiptText className="size-4" />
                    Đơn mua
                  </button>
                  <button
                    onClick={() => handleNavigate("/profile")}
                    className="mx-2 my-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <User className="size-4" />
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => handleNavigate("/favorites")}
                    className="mx-2 my-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Heart className="size-4" />
                    Yêu thích
                  </button>

                  <div className="mt-2 border-t border-neutral-100 px-2 pt-2 dark:border-neutral-800" />

                  <button
                    onClick={handleAuthAction}
                    disabled={isLoggingOut}
                    className="mx-2 mb-2 mt-1 flex w-[calc(100%-16px)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/40"
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
            aria-expanded={isSearchOpen}
            aria-controls="header-search-panel"
            onClick={() => {
              setIsMenuOpen(false);
              setIsUserMenuOpen(false);
              setActiveRootCategoryId(null);
              setIsSearchOpen(true);
            }}
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
            aria-label={
              isDark
                ? "Chuyển sang giao diện sáng"
                : "Chuyển sang giao diện tối"
            }
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
            aria-label={
              isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
            }
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

      <div aria-hidden className="h-18.25" />

      {isSearchOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-18.25 z-50">
          <button
            type="button"
            aria-label="Đóng tìm kiếm"
            onClick={closeSearch}
            className="absolute inset-0 bg-black/20"
          />

          <div className="relative px-4 pt-4 md:px-6 lg:px-10">
            <div
              id="header-search-panel"
              ref={searchPanelRef}
              className="mx-auto w-full max-w-330 overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
              role="dialog"
              aria-modal="true"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = searchKeyword.trim();
                  setDebouncedSearchKeyword(trimmed);
                }}
                className="border-b border-neutral-200 dark:border-neutral-700"
              >
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="h-12 w-full bg-white px-4 pr-24 text-sm text-neutral-900 outline-none dark:bg-neutral-900 dark:text-white"
                  />

                  <div className="absolute right-0 top-0 flex h-full items-center">
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="h-full px-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      aria-label="Tắt tìm kiếm"
                    >
                      <X className="size-5" />
                    </button>
                    <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
                    <button
                      type="submit"
                      className="h-full px-3 text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white"
                      aria-label="Tìm kiếm"
                    >
                      <Search className="size-5" />
                    </button>
                  </div>
                </div>
              </form>

              <div className="grid gap-0 md:grid-cols-12">
                <div className="border-b border-neutral-200 p-5 dark:border-neutral-700 md:col-span-4 md:border-b-0 md:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Gợi ý
                  </p>

                  <div className="mt-3 space-y-2">
                    {headerSuggestions.length > 0 ? (
                      headerSuggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setSearchKeyword(item);
                            setDebouncedSearchKeyword(item.trim());
                            searchInputRef.current?.focus();
                          }}
                          className="block w-full text-left text-sm text-neutral-800 hover:text-primary dark:text-neutral-100"
                        >
                          {item}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Nhập từ khóa để tìm sản phẩm.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 md:col-span-8">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Sản phẩm
                  </p>

                  <div className="mt-3">
                    {debouncedSearchKeyword.trim().length < 2 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Nhập ít nhất 2 ký tự để xem kết quả.
                      </p>
                    ) : isHeaderSearching ? (
                      <p className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tìm kiếm...
                      </p>
                    ) : isHeaderSearchError ? (
                      <p className="text-sm text-red-600 dark:text-red-300">
                        Không thể tìm kiếm lúc này. Vui lòng thử lại.
                      </p>
                    ) : headerSearchProducts.length === 0 ? (
                      <p className="text-sm text-neutral-700 dark:text-neutral-200">
                        Không tìm thấy sản phẩm phù hợp.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {headerSearchProducts.slice(0, 4).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              closeSearch();
                              router.push(`/product/${product.id}`);
                            }}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <div className="relative h-16 w-12 overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800">
                              <Image
                                src={normalizeProductImageUrl(product.imageUrl)}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-white">
                                {product.name}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {searchKeyword.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    const q = searchKeyword.trim();
                    closeSearch();
                    router.push(`/?q=${encodeURIComponent(q)}#product-search`);
                  }}
                  className="flex w-full items-center justify-between border-t border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                >
                  <span>Tìm kiếm “{searchKeyword.trim()}”</span>
                  <ArrowRight className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
              Home
            </Link>
            <Link
              href="/#new-arrivals"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              New Arrivals
            </Link>
            {rootCategories.map((category) => (
              <Link
                key={category.id}
                href={`/collection/${category.slug}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
              >
                {category.name}
              </Link>
            ))}

            <Link
              href={storeIntroPath}
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary"
            >
              Store
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
                  <div
                    id="mobile-user-menu"
                    className="mt-3 flex flex-col gap-2"
                  >
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
                      onClick={() => handleNavigate("/favorites")}
                      className="w-full rounded-md bg-neutral-100 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Yêu thích
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
