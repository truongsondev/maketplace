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
    <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
        variant="solid"
      />

      <main className="luxury-container flex-1 pb-20 pt-34">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <section className="luxury-panel p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="luxury-eyebrow">AURA STORE</p>
                <h1 className="luxury-title mt-4">Store</h1>
                <p className="luxury-copy mt-4 max-w-xl">
                  Không gian mua sắm tối giản, hiện đại và tập trung vào trải
                  nghiệm: thử đồ nhanh, tư vấn phối đồ, và chọn chất liệu phù
                  hợp.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/"
                    className="luxury-button inline-flex h-12 items-center justify-center px-6"
                  >
                    Mua sắm ngay
                  </Link>
                  <a
                    href="#hinh-anh"
                    className="luxury-button-ghost inline-flex h-12 items-center justify-center px-6"
                  >
                    Xem hình ảnh
                  </a>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="border border-black/10 bg-white/55 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                      Dịch vụ
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Tư vấn phối đồ
                    </p>
                  </div>
                  <div className="border border-black/10 bg-white/55 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                      Cam kết
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Đổi trả linh hoạt
                    </p>
                  </div>
                  <div className="border border-black/10 bg-white/55 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                      Chất lượng
                    </p>
                    <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                      Chất liệu chọn lọc
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative aspect-4/3 overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950">
                  <Image
                    src="/my.avif"
                    alt="Không gian cửa hàng"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="relative aspect-4/3 overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950">
                  <Image
                    src="/myshoppp.jpg"
                    alt="Góc trưng bày sản phẩm"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-video overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950 sm:col-span-2">
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

          <section id="hinh-anh" className="luxury-panel p-6 sm:p-8">
            <p className="luxury-eyebrow">Retail atmosphere</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
              Hình ảnh cửa hàng
            </h2>
            <p className="luxury-copy mt-3">
              Một vài góc nhìn để bạn hình dung không gian và cách trưng bày sản
              phẩm.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="relative aspect-4/3 overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950">
                <Image
                  src="/my.avif"
                  alt="Khu trưng bày 1"
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-4/3 overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950">
                <Image
                  src="/myshoppp.jpg"
                  alt="Khu trưng bày 2"
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-4/3 overflow-hidden border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-950">
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
            <div className="luxury-panel p-6">
              <p className="luxury-eyebrow">Địa chỉ</p>
              <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                Hệ thống cửa hàng AURA VN
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                (Bạn cập nhật địa chỉ cụ thể tại đây)
              </p>
            </div>

            <div className="luxury-panel p-6">
              <p className="luxury-eyebrow">Liên hệ</p>
              <p className="mt-2 text-sm text-neutral-900 dark:text-white">
                Hotline: (028) 7000 1441
              </p>
              <p className="mt-1 text-sm text-neutral-900 dark:text-white">
                Email: support@aura.vn
              </p>
            </div>

            <div className="luxury-panel p-6">
              <p className="luxury-eyebrow">Giờ mở cửa</p>
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
