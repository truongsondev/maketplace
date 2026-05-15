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

  const { data, isLoading, isFetching, isError, refetch } = useFavoriteProducts(
    page,
    PAGE_LIMIT,
  );

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
  const displayPage = Math.min(page, totalPages);

  return (
    <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
        variant="solid"
      />

      <main className="luxury-container flex-1 pb-20 pt-34">
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

        <section className="mb-12 border-y border-black/10 py-8 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                <Heart className="size-3.5" />
                Saved collection
              </div>
              <h1 className="luxury-title mt-4">Moodboard của bạn</h1>
              <p className="luxury-copy mt-4 max-w-2xl">
                Những item bạn giữ lại sẽ trở thành tín hiệu để AURA hiểu gu mặc
                và gợi ý bộ phối riêng hơn.
              </p>
            </div>

            <div className="border border-black/10 bg-white/55 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                Tổng sản phẩm yêu thích
              </p>
              <p className="mt-1 text-3xl font-semibold text-neutral-950 dark:text-white">
                {totalItems}
              </p>
            </div>
          </div>
        </section>

        {!isAuthenticated ? (
          <section className="border-y border-black/10 py-12 text-center dark:border-white/10">
            <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              Bạn cần đăng nhập để xem danh sách yêu thích.
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Sau khi đăng nhập, hệ thống sẽ đồng bộ đầy đủ sản phẩm đã lưu của
              bạn.
            </p>
            <Link href="/login" className="luxury-button mt-6">
              Đi đến đăng nhập
            </Link>
          </section>
        ) : isError ? (
          <section className="luxury-panel p-10 text-center">
            <p className="text-base font-semibold text-red-600 dark:text-red-300">
              Không thể tải danh sách yêu thích.
            </p>
            <button onClick={() => refetch()} className="luxury-button mt-5">
              Thử lại
            </button>
          </section>
        ) : isLoading ? (
          <FavoriteSkeleton />
        ) : mappedProducts.length === 0 ? (
          <section className="luxury-panel p-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Moodboard của bạn đang chờ item đầu tiên.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Khi một thiết kế chạm đúng gu, hãy giữ lại. Từ đó AURA có thể tạo
              những gợi ý cá nhân hơn.
            </p>
            <Link href="/" className="luxury-button-ghost mt-6">
              Khám phá sản phẩm
            </Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-12">
              {mappedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={
                    index % 5 === 0 ? "lg:col-span-6" : "lg:col-span-3"
                  }
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </section>

            <section className="luxury-panel mt-10 flex items-center justify-between px-4 py-3 sm:px-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trang {displayPage} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={displayPage <= 1 || isFetching}
                  className="luxury-button-ghost h-9 px-3 py-0"
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </button>

                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={displayPage >= totalPages || isFetching}
                  className="luxury-button-ghost h-9 px-3 py-0"
                >
                  Sau
                  <ChevronRight className="size-4" />
                </button>

                {isFetching && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
