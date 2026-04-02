"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import { Footer } from "@/components/page/footer";
import { Header } from "@/components/page/header";
import { ProductCard } from "@/components/page/product-card";
import { useFavoriteProducts } from "@/hooks/use-product-favorites";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";

const PAGE_LIMIT = 12;

function FavoriteSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-4 animate-pulse">
          <div className="aspect-3/4 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FavoriteProductsPage() {
  const [isDark, setIsDark] = useState(false);
  const [page, setPage] = useState(1);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useFavoriteProducts(page, PAGE_LIMIT);

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = cartSummary?.totalItems ?? 0;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const mappedProducts = useMemo(
    () =>
      (data?.products ?? []).map((item) => ({
        id: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        minPrice: String(item.minPrice),
      })),
    [data?.products],
  );

  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.total ?? 0;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="inline-flex items-center gap-1 text-sm md:gap-2">
            <li>
              <Link
                href="/"
                className="font-medium text-slate-500 transition-colors hover:text-primary"
              >
                Trang chủ
              </Link>
            </li>
            <li className="inline-flex items-center gap-1 md:gap-2">
              <ChevronRight className="size-4 text-slate-400" />
              <span className="font-semibold text-slate-900 dark:text-white">
                Sản phẩm yêu thích
              </span>
            </li>
          </ol>
        </nav>

        <section className="mb-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                <Heart className="size-3.5" />
                Danh sách yêu thích
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Sản phẩm bạn đã lưu
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Theo dõi nhanh các sản phẩm bạn quan tâm để quay lại mua bất kỳ lúc nào.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tổng sản phẩm yêu thích
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {totalItems}
              </p>
            </div>
          </div>
        </section>

        {!isAuthenticated ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              Bạn cần đăng nhập để xem danh sách yêu thích.
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Sau khi đăng nhập, hệ thống sẽ đồng bộ đầy đủ sản phẩm đã lưu của bạn.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Đi đến đăng nhập
            </Link>
          </section>
        ) : isError ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-300">
              Không thể tải danh sách yêu thích.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Thử lại
            </button>
          </section>
        ) : isLoading ? (
          <FavoriteSkeleton />
        ) : mappedProducts.length === 0 ? (
          <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Bạn chưa có sản phẩm yêu thích nào.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Khám phá cửa hàng và bấm biểu tượng tim để lưu lại sản phẩm bạn thích.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Khám phá sản phẩm
            </Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {mappedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </section>

            <section className="mt-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900 sm:px-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trang {page} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || isFetching}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </button>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages || isFetching}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Sau
                  <ChevronRight className="size-4" />
                </button>

                {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}