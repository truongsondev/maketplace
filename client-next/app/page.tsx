"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeroCarousel } from "@/components/hero-carousel";
import { Header } from "@/components/page/header";
import { FilterBar } from "@/components/page/filter-bar";
import { CategoriesGrid } from "@/components/page/categories-grid";
import { ProductsGrid } from "@/components/page/products-grid";
import { Footer } from "@/components/page/footer";
import { LetterSession } from "@/components/page/letter-session";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";

type SortMode = "popular" | "newest" | "priceAsc" | "priceDesc" | "nameAsc";

function normalizePrice(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts();
  const products = productsData?.products ?? [];

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = cartSummary?.totalItems ?? 0;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const displayedProducts = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    const filtered = keyword
      ? products.filter((item) => item.name.toLowerCase().includes(keyword))
      : [...products];

    switch (sortMode) {
      case "newest":
        return [...filtered].reverse();
      case "priceAsc":
        return [...filtered].sort(
          (a, b) => normalizePrice(a.minPrice) - normalizePrice(b.minPrice),
        );
      case "priceDesc":
        return [...filtered].sort(
          (a, b) => normalizePrice(b.minPrice) - normalizePrice(a.minPrice),
        );
      case "nameAsc":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  }, [debouncedSearch, products, sortMode]);

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (debouncedSearch.trim()) {
      chips.push(`Từ khóa: ${debouncedSearch.trim()}`);
    }

    if (sortMode !== "popular") {
      const sortLabel: Record<SortMode, string> = {
        popular: "Phổ biến",
        newest: "Mới nhất",
        priceAsc: "Giá tăng dần",
        priceDesc: "Giá giảm dần",
        nameAsc: "Tên A-Z",
      };
      chips.push(`Sắp xếp: ${sortLabel[sortMode]}`);
    }

    return chips;
  }, [debouncedSearch, sortMode]);

  const handleRemoveFilter = (filter: string) => {
    if (filter.startsWith("Từ khóa:")) {
      setSearchQuery("");
      return;
    }

    if (filter.startsWith("Sắp xếp:")) {
      setSortMode("popular");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortMode("popular");
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <main className="flex-1 flex flex-col">
        <HeroCarousel />
        <section
          id="sale"
          className="grid grid-cols-1 gap-3 border-b border-neutral-200 bg-white px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900 sm:grid-cols-3 lg:px-10"
        >
          <div className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            Miễn phí vận chuyển cho đơn từ 499K
          </div>
          <div className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            Đổi trả trong 30 ngày
          </div>
          <div className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            Hỗ trợ khách hàng 24/7
          </div>
        </section>
        <FilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortBy={sortMode}
          onSortChange={(value) => setSortMode(value as SortMode)}
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearFilters={handleClearFilters}
        />
        <section id="categories" className="scroll-mt-32">
          <CategoriesGrid
            categories={categories}
            isLoading={isCategoriesLoading}
          />
        </section>
        <section id="products" className="scroll-mt-32">
          <ProductsGrid
            products={displayedProducts}
            isLoading={isProductsLoading}
            isError={isProductsError}
            activeFilters={activeFilters}
            onRetry={() => refetchProducts()}
            onClearFilters={handleClearFilters}
          />
        </section>
      </main>
      <LetterSession />
      <Footer />
    </div>
  );
}
