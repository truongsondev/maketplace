"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { TeamSection } from "@/components/page/team-section";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { cartService } from "@/services/cart.service";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80";

type NormalizedProduct = {
  id: string;
  name: string;
  imageUrl: string;
  minPrice: string | number;
};

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
      "/upload/f_auto,q_auto,c_fill,w_1400,h_1600/",
    );
  }

  if (
    absoluteUrl.includes("images.unsplash.com") &&
    !absoluteUrl.includes("w=")
  ) {
    return `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}auto=format&fit=crop&w=1400&q=80`;
  }

  return absoluteUrl;
}

function formatCurrency(price: string | number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price));
}

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [newArrivalApi, setNewArrivalApi] = useState<CarouselApi>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories(true);
  const {
    data: newArrivalsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts({
    sort: "createdAt:desc",
    limit: 12,
    page: 1,
  });

  const {
    data: categoryShowcasesData = [],
    isLoading: isCategoryShowcasesLoading,
    isError: isCategoryShowcasesError,
    refetch: refetchCategoryShowcases,
  } = useQuery({
    queryKey: ["category-showcases", { categoryLimit: 2, productLimit: 4 }],
    queryFn: () =>
      productService.getCategoryShowcases({
        categoryLimit: 2,
        productLimit: 4,
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const newArrivals = useMemo<NormalizedProduct[]>(() => {
    return (newArrivalsData?.products ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      minPrice: item.minPrice,
      imageUrl: normalizeProductImageUrl(item.imageUrl),
    }));
  }, [newArrivalsData?.products]);

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCartSummary(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = cartSummary?.totalItems ?? 0;

  const heroProduct = newArrivals[0];
  const promoProduct = newArrivals[1] ?? newArrivals[0];

  const categoryShowcases = useMemo(() => {
    const realShowcases = categoryShowcasesData.map((showcase) => ({
      id: showcase.id,
      slug: showcase.slug,
      name: showcase.name,
      imageUrl: normalizeProductImageUrl(showcase.imageUrl),
      products: showcase.products.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: normalizeProductImageUrl(product.imageUrl),
        minPrice: product.minPrice,
      })),
    }));

    if (realShowcases.length > 0) {
      return realShowcases;
    }

    return categories.slice(0, 2).map((category, idx) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      imageUrl: normalizeProductImageUrl(category.imageUrl),
      products: newArrivals.slice(idx * 4, idx * 4 + 4),
    }));
  }, [categories, categoryShowcasesData, newArrivals]);

  const heroImage =
    heroProduct?.imageUrl ??
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1800&q=80";

  const categoryItems = useMemo(() => {
    return categories.slice(0, 4).map((item, index) => ({
      id: item.id,
      title: item.name,
      slug: item.slug,
      image:
        normalizeProductImageUrl(item.imageUrl) ||
        `https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80&sig=${index}`,
      count: item.productCount,
    }));
  }, [categories]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (!newArrivalApi) return;

    const interval = setInterval(() => {
      if (newArrivalApi.canScrollNext()) {
        newArrivalApi.scrollNext();
      } else {
        newArrivalApi.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [newArrivalApi]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <main className="flex-1 bg-[#f5f5f5] text-[#222222] dark:bg-neutral-950 dark:text-neutral-100">
        <section
          id="hero"
          className="relative min-h-[72vh] overflow-hidden bg-black"
        >
          <Image
            src={heroImage}
            alt="Hero streetwear"
            fill
            priority
            className="object-cover opacity-85"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative mx-auto flex min-h-[72vh] w-full max-w-330 items-end px-4 pb-14 pt-24 md:px-6 lg:px-8">
            <div className="max-w-3xl text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                New Collection 2026
              </p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">
                Streetwear Tối Giản
                <br />
                Cho Mọi Khoảnh Khắc
              </h1>
              <p className="mt-5 max-w-2xl text-base text-white/85 md:text-lg">
                Thiết kế tập trung vào chất liệu, form và khả năng phối đồ linh
                hoạt. Dữ liệu sản phẩm đồng bộ trực tiếp từ API để đảm bảo thông
                tin luôn mới nhất.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#new-arrivals"
                  className="inline-flex h-11 items-center justify-center rounded-sm bg-white px-6 text-sm font-bold uppercase text-black transition-colors hover:bg-neutral-200"
                >
                  Shop Now
                </a>
                <a
                  href="#category-showcase-1"
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-white/60 px-6 text-sm font-bold uppercase text-white transition-colors hover:bg-white/10"
                >
                  Mix Theo Danh Mục
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                Featured Categories
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase md:text-4xl">
                Danh mục nổi bật
              </h2>
            </div>
          </div>

          {isCategoriesLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-4/5 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryItems.map((item) => (
                <a
                  key={item.id}
                  href={`/#category-showcase-1`}
                  className="group relative block overflow-hidden rounded-sm bg-white shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="relative aspect-4/5">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/30" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h3 className="text-xl font-extrabold uppercase">
                        {item.title}
                      </h3>
                      <p className="text-sm text-white/90">
                        {item.count} sản phẩm
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section
          id="new-arrivals"
          className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                Latest Drop
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase md:text-4xl">
                Sản phẩm mới nhất
              </h2>
            </div>
          </div>

          <Carousel
            setApi={setNewArrivalApi}
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {newArrivals.map((item, idx) => (
                <CarouselItem
                  key={item.id}
                  className="basis-[78%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <article className="group h-full overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                    <a
                      href={`/product/${item.id}`}
                      className="relative block aspect-4/5 overflow-hidden"
                    >
                      <Image
                        src={item.imageUrl || FALLBACK_IMAGE}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-sm bg-black px-2 py-1 text-[11px] font-bold uppercase text-white">
                        {idx % 3 === 0 ? "Sale" : "New"}
                      </span>
                    </a>
                    <div className="p-4">
                      <a
                        href={`/product/${item.id}`}
                        className="line-clamp-2 text-sm font-semibold uppercase hover:text-neutral-500"
                      >
                        {item.name}
                      </a>
                      <p className="mt-2 text-lg font-black">
                        {formatCurrency(item.minPrice)}
                      </p>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        <section
          id="sale"
          className="relative min-h-85 overflow-hidden bg-black text-white md:min-h-105"
        >
          <Image
            src={promoProduct?.imageUrl || FALLBACK_IMAGE}
            alt="Promo"
            fill
            className="object-cover opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto flex min-h-85 w-full max-w-330 items-center justify-between gap-6 px-4 md:min-h-105 md:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                Limited Time Offer
              </p>
              <h3 className="mt-2 text-3xl font-black uppercase md:text-5xl">
                Ưu đãi tới 50%
              </h3>
              <p className="mt-3 text-white/85">
                Săn giá tốt cho các item được yêu thích nhất tuần này.
              </p>
            </div>
            <a
              href="#category-showcase-1"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-sm bg-white px-6 text-sm font-bold uppercase text-black hover:bg-neutral-200"
            >
              Mua ngay
              <ArrowRight className="size-4" />
            </a>
          </div>
        </section>

        {categoryShowcases.map((group, idx) => (
          <section
            id={`category-showcase-${idx + 1}`}
            key={group.id}
            className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Category Spotlight
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase md:text-4xl">
                  {group.name}
                </h2>
              </div>
              <a
                href={`/collection/${group.slug}`}
                className="inline-flex h-10 items-center rounded-sm border border-black/20 px-4 text-xs font-bold uppercase hover:border-black"
              >
                Xem nhanh
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <a
                href={`/collection/${group.slug}`}
                className="group relative block overflow-hidden rounded-sm lg:col-span-4"
              >
                <div className="relative aspect-[4/5] min-h-[320px] w-full md:aspect-[16/10] lg:aspect-[4/5]">
                  <Image
                    src={
                      group.imageUrl ||
                      group.products[0]?.imageUrl ||
                      FALLBACK_IMAGE
                    }
                    alt={group.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 34vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      Outfit Gợi Ý
                    </p>
                    <h3 className="mt-2 text-2xl font-black uppercase leading-tight">
                      {group.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/85">
                      Phối nhanh theo danh mục, tối ưu cho trang phục đi làm và
                      đi chơi.
                    </p>
                  </div>
                </div>
              </a>

              <div className="grid grid-cols-2 gap-4 lg:col-span-8 lg:grid-cols-3">
                {group.products.map((item) => (
                  <article
                    key={`${group.id}-${item.id}`}
                    className="group overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <a
                      href={`/product/${item.id}`}
                      className="relative block aspect-4/5 overflow-hidden"
                    >
                      <Image
                        src={item.imageUrl || FALLBACK_IMAGE}
                        alt={item.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 24vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </a>
                    <div className="p-4">
                      <a
                        href={`/product/${item.id}`}
                        className="line-clamp-2 text-sm font-semibold uppercase hover:text-neutral-500"
                      >
                        {item.name}
                      </a>
                      <p className="mt-2 text-lg font-black">
                        {formatCurrency(item.minPrice)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        <TeamSection />

        <section
          id="brand-value"
          className="bg-[#ececec] py-16 dark:bg-neutral-900"
        >
          <div className="mx-auto w-full max-w-330 px-4 md:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-black uppercase md:text-4xl">
              Brand Value
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Giao hàng nhanh",
                  description:
                    "Xử lý đơn trong ngày, giao nhanh trên toàn quốc.",
                  icon: Truck,
                },
                {
                  title: "Đổi trả dễ dàng",
                  description:
                    "Hỗ trợ đổi trả linh hoạt với quy trình rõ ràng.",
                  icon: RotateCcw,
                },
                {
                  title: "Chất lượng cao",
                  description:
                    "Kiểm soát chất liệu và đường may trước khi lên kệ.",
                  icon: ShieldCheck,
                },
                {
                  title: "Thanh toán an toàn",
                  description:
                    "Nhiều phương thức thanh toán bảo mật, tiện lợi.",
                  icon: CreditCard,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-sm bg-white p-5 shadow-sm dark:bg-neutral-800"
                  >
                    <Icon className="size-6 text-black dark:text-white" />
                    <h3 className="mt-4 text-lg font-black uppercase">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {(isProductsLoading ||
          isProductsError ||
          isCategoryShowcasesLoading ||
          isCategoryShowcasesError) && (
          <section className="mx-auto w-full max-w-330 px-4 py-8 md:px-6 lg:px-8">
            {isProductsLoading || isCategoryShowcasesLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-sm bg-white p-4 text-sm font-medium text-slate-700 dark:bg-neutral-900 dark:text-neutral-100">
                <Loader2 className="size-4 animate-spin" />
                Đang đồng bộ dữ liệu Home từ API...
              </div>
            ) : (
              <button
                onClick={() => {
                  refetchProducts();
                  refetchCategoryShowcases();
                }}
                className="mx-auto flex items-center gap-2 rounded-sm bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Tải dữ liệu Home thất bại, thử lại
                <ArrowRight className="size-4" />
              </button>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
