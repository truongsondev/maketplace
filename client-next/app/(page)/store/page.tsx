"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Footer } from "@/components/page/footer";
import { Header } from "@/components/page/header";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";

export default function StorePage() {
  const [isDark, setIsDark] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCartSummary(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = useMemo(() => cartSummary?.totalItems ?? 0, [cartSummary]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors duration-200 dark:bg-black dark:text-white flex flex-col">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <section className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  AURA STORE
                </p>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
                  Store
                </h1>
                <p className="mt-4 max-w-xl text-sm text-neutral-600 dark:text-neutral-300 md:text-base">
                  Không gian mua sắm tối giản, hiện đại và tập trung vào trải
                  nghiệm: thử đồ nhanh, tư vấn phối đồ, và chọn chất liệu phù
                  hợp.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/"
                    className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    Mua sắm ngay
                  </Link>
                  <a
                    href="#hinh-anh"
                    className="inline-flex h-12 items-center justify-center rounded-sm border border-neutral-200 bg-white px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                  >
                    Xem hình ảnh
                  </a>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm shadow-sm dark:border-neutral-800 dark:bg-black">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Dịch vụ
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Tư vấn phối đồ
                    </p>
                  </div>
                  <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm shadow-sm dark:border-neutral-800 dark:bg-black">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Cam kết
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Đổi trả linh hoạt
                    </p>
                  </div>
                  <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm shadow-sm dark:border-neutral-800 dark:bg-black">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Chất lượng
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Chất liệu chọn lọc
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-black">
                  <Image
                    src="/my.avif"
                    alt="Không gian cửa hàng"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-black">
                  <Image
                    src="/myshoppp.jpg"
                    alt="Góc trưng bày sản phẩm"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-video overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-black sm:col-span-2">
                  <Image
                    src="/my.avif"
                    alt="Khu vực thử đồ"
                    fill
                    sizes="(min-width: 1024px) 80vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="hinh-anh"
            className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8"
          >
            <h2 className="text-lg font-bold sm:text-xl">Hình ảnh cửa hàng</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Một vài góc nhìn để bạn hình dung không gian và cách trưng bày sản
              phẩm.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-black">
                <Image
                  src="/my.avif"
                  alt="Khu trưng bày 1"
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-black">
                <Image
                  src="/myshoppp.jpg"
                  alt="Khu trưng bày 2"
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-black">
                <Image
                  src="/my.avif"
                  alt="Khu trưng bày 3"
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Địa chỉ
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                Hệ thống cửa hàng AURA VN
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                (Bạn cập nhật địa chỉ cụ thể tại đây)
              </p>
            </div>

            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Liên hệ
              </p>
              <p className="mt-2 text-sm text-neutral-900 dark:text-white">
                Hotline: (028) 7000 1441
              </p>
              <p className="mt-1 text-sm text-neutral-900 dark:text-white">
                Email: support@aura.vn
              </p>
            </div>

            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Giờ mở cửa
              </p>
              <p className="mt-2 text-sm text-neutral-900 dark:text-white">
                09:00 - 21:00 (hàng ngày)
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
