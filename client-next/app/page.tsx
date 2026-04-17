"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
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
import { bannerService } from "@/services/banner.service";
import { voucherService } from "@/services/voucher.service";
import { useAuthStore } from "@/stores/auth.store";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80";

type NormalizedProduct = {
  id: string;
  name: string;
  imageUrl: string;
  minPrice: string | number;
};

function SearchParamsSync({ onQuery }: { onQuery: (q: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;

    onQuery(q);
  }, [onQuery, searchParams]);

  return null;
}

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

function formatVoucherValue(
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  value: number,
) {
  if (type === "PERCENTAGE") return `${value}%`;
  return formatCurrency(value);
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function RevealSection({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0px)" : "translateY(18px)",
        transition: prefersReducedMotion
          ? "none"
          : `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");
  const [newArrivalApi, setNewArrivalApi] = useState<CarouselApi>();
  const [topBannerApi, setTopBannerApi] = useState<CarouselApi>();
  const [topBannerCurrent, setTopBannerCurrent] = useState(0);
  const [promoApi, setPromoApi] = useState<CarouselApi>();
  const [promoCurrent, setPromoCurrent] = useState(0);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const syncSearchFromUrl = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setSearchKeyword((prev) => (prev === trimmed ? prev : trimmed));
    setDebouncedSearchKeyword((prev) => (prev === trimmed ? prev : trimmed));
  }, []);

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
    data: searchProductsData,
    isFetching: isSearchLoading,
    isError: isSearchError,
  } = useQuery({
    queryKey: ["products", "search", debouncedSearchKeyword],
    queryFn: () =>
      productService.getProducts({
        q: debouncedSearchKeyword,
        sort: "createdAt:desc",
        limit: 8,
        page: 1,
      }),
    enabled: debouncedSearchKeyword.length >= 2,
    staleTime: 1000 * 20,
    retry: false,
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

  const { data: activeBanners = [] } = useQuery({
    queryKey: ["active-homepage-banners"],
    queryFn: () => bannerService.getActiveBanners(),
    staleTime: 1000 * 60,
    retry: false,
  });

  const { data: activeVouchers = [] } = useQuery({
    queryKey: ["active-vouchers-banner"],
    queryFn: () => voucherService.getActiveVouchers(),
    staleTime: 1000 * 60,
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

  const promoProduct = newArrivals[1] ?? newArrivals[0];
  const topBannerSlides = useMemo(() => {
    return activeBanners.map((banner) => ({
      id: banner.id,
      imageUrl: normalizeProductImageUrl(
        banner.imageUrl || promoProduct?.imageUrl || FALLBACK_IMAGE,
      ),
      sectionLabel: "Bộ sưu tập mới",
      title: banner.title,
      description:
        banner.description ||
        "Khám phá bộ sưu tập thời trang mới nhất được cập nhật liên tục.",
      eyebrow: banner.subtitle || "THỜI TRANG HÔM NAY",
    }));
  }, [activeBanners, promoProduct?.imageUrl]);

  const promoSlides = useMemo(() => {
    const voucherSlides = activeVouchers.map((voucher) => {
      const remainingSlots =
        voucher.maxUsage !== null
          ? Math.max(voucher.maxUsage - voucher.usedCount, 0)
          : null;

      return {
        id: voucher.id,
        imageUrl: normalizeProductImageUrl(
          voucher.bannerImageUrl || promoProduct?.imageUrl || FALLBACK_IMAGE,
        ),
        eyebrow: "Voucher ưu đãi",
        title:
          voucher.type === "PERCENTAGE"
            ? `Voucher ${voucher.code} - Giảm ${voucher.value}%`
            : `Voucher ${voucher.code} - Giảm ${voucher.value.toLocaleString("vi-VN")}đ`,
        description:
          voucher.description ||
          "Săn giá tốt cho các item được yêu thích nhất tuần này.",
        codeLabel: voucher.code,
        discountLabel: formatVoucherValue(voucher.type, voucher.value),
        highlights: [
          `Giảm ${formatVoucherValue(voucher.type, voucher.value)}`,
          voucher.minOrderAmount
            ? `Đơn tối thiểu ${formatCurrency(voucher.minOrderAmount)}`
            : "Áp dụng đơn hợp lệ",
          remainingSlots !== null
            ? `Còn lại ${Math.max(remainingSlots, 1)} suất`
            : "Không giới hạn suất",
        ],
        endDate: new Date(voucher.endAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      };
    });

    return voucherSlides;
  }, [activeVouchers, promoProduct?.imageUrl]);
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

  const categoryItems = useMemo(() => {
    const rootCategories = categories
      .filter((category) => !category.parentId && category.slug !== "cua-hang")
      .sort((a, b) => a.name.localeCompare(b.name));

    return rootCategories.slice(0, 4).map((item, index) => ({
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
    const trimmed = searchKeyword.trim();
    const handle = window.setTimeout(() => {
      setDebouncedSearchKeyword(trimmed);
    }, 350);

    return () => window.clearTimeout(handle);
  }, [searchKeyword]);

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

  useEffect(() => {
    if (!topBannerApi) return;

    const onSelect = () => {
      setTopBannerCurrent(topBannerApi.selectedScrollSnap());
    };

    onSelect();
    topBannerApi.on("select", onSelect);

    return () => {
      topBannerApi.off("select", onSelect);
    };
  }, [topBannerApi]);

  useEffect(() => {
    if (!topBannerApi || topBannerSlides.length <= 1) return;

    const interval = setInterval(() => {
      topBannerApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [topBannerApi, topBannerSlides.length]);

  useEffect(() => {
    if (!promoApi) return;

    const onSelect = () => {
      setPromoCurrent(promoApi.selectedScrollSnap());
    };

    onSelect();
    promoApi.on("select", onSelect);

    return () => {
      promoApi.off("select", onSelect);
    };
  }, [promoApi]);

  useEffect(() => {
    if (!promoApi || promoSlides.length <= 1) return;

    const interval = setInterval(() => {
      promoApi.scrollNext();
    }, 5500);

    return () => clearInterval(interval);
  }, [promoApi, promoSlides.length]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <Suspense fallback={null}>
        <SearchParamsSync onQuery={syncSearchFromUrl} />
      </Suspense>

      <main className="flex-1 bg-[#f5f5f5] text-[#222222] dark:bg-neutral-950 dark:text-neutral-100">
        {topBannerSlides.length > 0 ? (
          <section
            id="homepage-banner"
            className="relative min-h-125 overflow-hidden bg-black text-white"
          >
            <Carousel
              setApi={setTopBannerApi}
              opts={{ align: "start", loop: topBannerSlides.length > 1 }}
              className="h-full w-full"
            >
              <CarouselContent className="ml-0">
                {topBannerSlides.map((slide) => (
                  <CarouselItem key={slide.id} className="pl-0">
                    <div className="relative min-h-125 overflow-hidden md:min-h-160">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        className="object-cover object-center opacity-80"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-black/15" />

                      <div className="relative mx-auto flex min-h-125 w-full max-w-330 flex-col justify-center gap-4 px-4 py-8 md:min-h-160 md:px-6 lg:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                          {slide.sectionLabel}
                        </p>
                        <h2 className="max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">
                          {slide.title}
                        </h2>
                        <p className="max-w-2xl text-sm text-white/90 md:text-base">
                          {slide.description}
                        </p>
                        <span className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-white">
                          {slide.eyebrow}
                        </span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {topBannerSlides.length > 1 ? (
              <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full border border-white/35 bg-black/45 px-3 py-1 text-xs font-semibold tracking-wider text-white md:bottom-5 md:right-6">
                {topBannerCurrent + 1}/{topBannerSlides.length}
              </div>
            ) : null}
          </section>
        ) : null}
        <RevealSection>
          <section
            id="categories"
            className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Danh mục nổi bật
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
                {categoryItems.map((item, idx) => (
                  <a
                    key={item.id}
                    href={`/collection/${item.slug}`}
                    className="group relative block overflow-hidden rounded-sm bg-white shadow-sm transition-transform hover:-translate-y-1"
                    style={{
                      animation: `fadeInUp 480ms ease ${Math.min(idx * 80, 280)}ms both`,
                    }}
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
        </RevealSection>

        <RevealSection delay={60}>
          <section
            id="new-arrivals"
            className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Mới ra mắt
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
                    <article
                      className="group h-full overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                      style={{
                        animation: `fadeInUp 520ms ease ${Math.min(idx * 70, 280)}ms both`,
                      }}
                    >
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
        </RevealSection>

        {promoSlides.length > 0 ? (
          <section
            id="sale"
            className="relative min-h-105 overflow-hidden bg-black text-white md:min-h-140"
          >
            <Carousel
              setApi={setPromoApi}
              opts={{ align: "start", loop: promoSlides.length > 1 }}
              className="h-full w-full"
            >
              <CarouselContent className="ml-0">
                {promoSlides.map((slide) => (
                  <CarouselItem key={slide.id} className="pl-0">
                    <div className="relative min-h-105 overflow-hidden md:min-h-140">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        className="object-cover object-center opacity-35 blur-[2px]"
                        sizes="100vw"
                      />
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        className="object-contain object-center px-4 py-6 opacity-95 md:px-10 md:py-8"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-black/20" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/20" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(255,255,255,0.15),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(255,120,0,0.24),transparent_40%)]" />

                      <div className="relative mx-auto flex min-h-105 w-full max-w-330 flex-col justify-center gap-8 px-4 py-8 md:min-h-140 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
                        <div className="max-w-3xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                            {slide.eyebrow}
                          </p>
                          <h3 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                            {slide.title}
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
                            {slide.description}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {slide.highlights.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white"
                              >
                                {item}
                              </span>
                            ))}
                            {slide.endDate ? (
                              <span className="rounded-full border border-orange-300/60 bg-orange-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-orange-100">
                                HSD: {slide.endDate}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="w-full max-w-sm rounded-xl border border-white/40 bg-black/35 p-4 backdrop-blur-[2px] md:p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
                            Mã voucher
                          </p>
                          <p className="mt-2 text-2xl font-black uppercase tracking-wide text-orange-200 md:text-3xl">
                            {slide.codeLabel}
                          </p>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-white/25 bg-white/10 p-3">
                              <p className="text-[10px] uppercase tracking-widest text-white/70">
                                Mức giảm
                              </p>
                              <p className="mt-1 text-lg font-black text-white">
                                {slide.discountLabel}
                              </p>
                            </div>
                            <div className="rounded-lg border border-white/25 bg-white/10 p-3">
                              <p className="text-[10px] uppercase tracking-widest text-white/70">
                                Hiệu lực
                              </p>
                              <p className="mt-1 text-sm font-bold text-white">
                                {slide.endDate
                                  ? `Đến ${slide.endDate}`
                                  : "Đang mở"}
                              </p>
                            </div>
                          </div>
                          <a
                            href="#category-showcase-1"
                            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-white px-7 text-sm font-extrabold uppercase tracking-[0.08em] text-black shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-orange-300"
                          >
                            Mua ngay
                            <ArrowRight className="size-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {promoSlides.length > 1 ? (
              <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full border border-white/35 bg-black/45 px-3 py-1 text-xs font-semibold tracking-wider text-white md:bottom-5 md:right-6">
                {promoCurrent + 1}/{promoSlides.length}
              </div>
            ) : null}
          </section>
        ) : null}
        {categoryShowcases.map((group, idx) => (
          <section
            id={`category-showcase-${idx + 1}`}
            key={group.id}
            className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Tủ đò của bạn cần gì, Aura đã sẵn sàng.
                </p>
              </div>
              <a
                href={`/collection/${group.slug}`}
                className="inline-flex h-10 items-center rounded-sm border border-black/20 px-4 text-xs font-bold uppercase hover:border-black"
              >
                Xem nhanh
              </a>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 lg:gap-5">
              <a
                href={`/collection/${group.slug}`}
                className="group relative block overflow-hidden rounded-sm lg:col-span-4 lg:h-full"
              >
                <div className="relative aspect-4/5 min-h-80 w-full md:aspect-16/10 lg:h-full lg:min-h-152 lg:aspect-auto">
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
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
                </div>
              </a>
              <div className="grid grid-cols-2 gap-4 lg:col-span-8 lg:h-full lg:grid-flow-col lg:grid-cols-3 lg:grid-rows-2">
                {group.products.slice(0, 6).map((item) => (
                  <article
                    key={`${group.id}-${item.id}`}
                    className="group overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 lg:grid lg:h-full lg:grid-rows-[minmax(0,1fr)_auto]"
                  >
                    <a
                      href={`/product/${item.id}`}
                      className="relative block aspect-4/5 overflow-hidden lg:h-full lg:min-h-0 lg:aspect-auto"
                    >
                      <Image
                        src={item.imageUrl || FALLBACK_IMAGE}
                        alt={item.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 24vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </a>
                    <div className="p-3 md:p-4">
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
        <RevealSection delay={80}>
          <TeamSection />
        </RevealSection>

        <RevealSection delay={90}>
          <section
            id="brand-value"
            className="bg-[#ececec] py-16 dark:bg-neutral-900"
          >
            <div className="mx-auto w-full max-w-330 px-4 md:px-6 lg:px-8">
              <h2 className="text-center text-3xl font-black uppercase md:text-4xl">
                Giá trị thương hiệu
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
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-sm bg-white p-5 shadow-sm dark:bg-neutral-800"
                      style={{
                        animation: `fadeInUp 500ms ease ${Math.min(idx * 80, 260)}ms both`,
                      }}
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
        </RevealSection>

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

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
