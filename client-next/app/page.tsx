"use client";

import Image from "next/image";
import Link from "next/link";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
import { RecommendationShelf } from "@/components/page/recommendation-shelf";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { ProductCard } from "@/components/page/product-card";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { cartService } from "@/services/cart.service";
import { productService } from "@/services/product.service";
import { bannerService } from "@/services/banner.service";
import { voucherService } from "@/services/voucher.service";
import { promotionService } from "@/services/promotion.service";
import { useAuthStore } from "@/stores/auth.store";
import { trackingService } from "@/services/tracking.service";

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
  const shouldShow = prefersReducedMotion || isVisible;

  useEffect(() => {
    if (prefersReducedMotion) {
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
        opacity: shouldShow ? 1 : 0,
        transform: shouldShow ? "translateY(0px)" : "translateY(18px)",
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
  const lastTrackedSearchRef = useRef<string>("");
  const queryClient = useQueryClient();
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

  const { data: searchProductsData, isFetching: isSearchLoading } = useQuery({
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
        categoryLimit: 4,
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
  const { data: activePromotions = [] } = useQuery({
    queryKey: ["active-promotion-campaigns"],
    queryFn: () => promotionService.getActive(),
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
    const campaignSlides = activePromotions.map((campaign) => ({
      id: campaign.id,
      imageUrl: normalizeProductImageUrl(
        campaign.bannerImageUrl || promoProduct?.imageUrl || FALLBACK_IMAGE,
      ),
      eyebrow:
        campaign.campaignType === "FLASH_SALE"
          ? "Flash sale"
          : "Chiến dịch khuyến mãi",
      title: campaign.title,
      description: campaign.subtitle || campaign.description,
      codeLabel: "TỰ ĐỘNG",
      discountLabel:
        campaign.type === "PERCENTAGE"
          ? `${campaign.value}%`
          : formatCurrency(campaign.value),
      highlights: [
        "Không cần nhập mã",
        campaign.stackableWithVoucher
          ? "Có thể dùng thêm voucher"
          : "Không cộng thêm voucher",
        campaign.campaignType.replaceAll("_", " "),
      ],
      endDate: new Date(campaign.endAt).toLocaleDateString("vi-VN"),
      ctaUrl: campaign.ctaUrl || `/promotions/${campaign.slug}`,
      ctaLabel: campaign.ctaLabel || "Xem ưu đãi",
      isCampaign: true,
    }));
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
        ctaUrl: "#category-showcase-1",
        ctaLabel: "Mua ngay",
        isCampaign: false,
      };
    });

    return [...campaignSlides, ...voucherSlides];
  }, [activePromotions, activeVouchers, promoProduct?.imageUrl]);
  const campaignSlides = useMemo(
    () => promoSlides.filter((slide) => slide.isCampaign),
    [promoSlides],
  );
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
    const trimmed = debouncedSearchKeyword.trim();
    if (
      trimmed.length < 2 ||
      isSearchLoading ||
      lastTrackedSearchRef.current === trimmed
    ) {
      return;
    }

    lastTrackedSearchRef.current = trimmed;
    void trackingService
      .track({
        eventType: "SEARCH_QUERY",
        searchQuery: trimmed,
        source: "homepage_search",
        placement: "home_search",
        metadata: {
          resultCount: searchProductsData?.pagination.total ?? 0,
          queryLength: trimmed.length,
        },
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      });
  }, [
    debouncedSearchKeyword,
    isSearchLoading,
    queryClient,
    searchProductsData?.pagination.total,
  ]);

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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f7f3ec] text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <Suspense fallback={null}>
        <SearchParamsSync onQuery={syncSearchFromUrl} />
      </Suspense>

      <main className="-mt-18.25 flex-1 bg-[#f7f3ec] text-[#171412] dark:bg-neutral-950 dark:text-neutral-100">
        {topBannerSlides.length > 0 ? (
          <section
            id="homepage-banner"
            className="relative min-h-screen overflow-hidden bg-black text-white"
          >
            <Carousel
              setApi={setTopBannerApi}
              opts={{ align: "start", loop: topBannerSlides.length > 1 }}
              className="h-full w-full"
            >
              <CarouselContent className="ml-0">
                {topBannerSlides.map((slide) => (
                  <CarouselItem key={slide.id} className="pl-0">
                    <div className="relative min-h-screen overflow-hidden">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        priority
                        className="object-cover object-center opacity-88"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-black/78 via-black/34 to-black/10" />
                      <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-t from-[#f7f3ec] via-[#f7f3ec]/35 to-transparent dark:from-neutral-950" />

                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="relative mx-auto flex min-h-screen w-full max-w-330 flex-col justify-center gap-6 px-4 pb-24 pt-28 md:px-6 lg:px-8"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/72">
                          {slide.sectionLabel} / {slide.eyebrow}
                        </p>
                        <h1 className="max-w-5xl text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.05em] md:text-8xl lg:text-9xl">
                          {slide.title}
                        </h1>
                        <p className="max-w-2xl text-base font-light leading-7 text-white/82 md:text-lg">
                          {slide.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-3">
                          <a
                            href="#new-arrivals"
                            className="inline-flex h-12 items-center justify-center border border-white bg-white px-7 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-all hover:bg-transparent hover:text-white"
                          >
                            Khám phá
                          </a>
                          <a
                            href="#categories"
                            className="inline-flex h-12 items-center justify-center border border-white/35 px-7 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:border-white hover:bg-white/10"
                          >
                            Bộ sưu tập
                          </a>
                        </div>
                      </motion.div>
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
            className="mx-auto w-full max-w-330 px-4 py-20 md:px-6 lg:px-8"
          >
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Editorial categories
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-6xl">
                  Chọn mood cho tủ đồ hôm nay
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
                {categoryItems.map((item, idx) => (
                  <motion.a
                    key={item.id}
                    href={`/collection/${item.slug}`}
                    className={`group relative block overflow-hidden bg-black shadow-sm ${
                      idx === 0 || idx === 3 ? "lg:col-span-5" : "lg:col-span-7"
                    }`}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "80px" }}
                    transition={{
                      duration: 0.65,
                      delay: Math.min(idx * 0.08, 0.24),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div className="relative aspect-[4/5] lg:aspect-[16/10]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent transition-colors group-hover:from-black/85" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
                        <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/65">
                          {item.count} sản phẩm
                        </p>
                        <h3 className="text-3xl font-semibold uppercase tracking-[-0.04em] md:text-5xl">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </section>
        </RevealSection>

        {campaignSlides.length > 0 ? (
          <RevealSection delay={50}>
            <section
              id="sale"
              className="luxury-section overflow-hidden bg-neutral-950 text-white"
            >
              <Carousel
                setApi={setPromoApi}
                opts={{ align: "start", loop: campaignSlides.length > 1 }}
                className="w-full"
              >
                <CarouselContent className="ml-0">
                  {campaignSlides.map((slide) => (
                    <CarouselItem key={slide.id} className="pl-0">
                      <div className="relative h-[clamp(600px,42vw,700px)] w-full overflow-hidden bg-black">
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 scale-110 bg-cover bg-center opacity-55 blur-xl"
                          style={{ backgroundImage: `url(${slide.imageUrl})` }}
                        />
                        <Image
                          src={slide.imageUrl}
                          alt={slide.title}
                          fill
                          priority
                          sizes="100vw"
                          className="object-contain object-center"
                        />
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/48 to-black/10" />
                        <div className="absolute inset-0 mx-auto flex w-full max-w-330 items-center px-5 py-8 sm:px-8 lg:px-14">
                          <div className="w-full max-w-2xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
                              {slide.eyebrow}
                            </p>
                            <h2 className="mt-5 text-4xl font-semibold uppercase leading-none md:text-6xl">
                              {slide.title}
                            </h2>
                            <p className="mt-6 max-w-xl text-sm leading-7 text-white/85 md:text-base">
                              {slide.description}
                            </p>
                            <div className="mt-8 grid max-w-2xl gap-px border-y border-white/25 sm:grid-cols-3">
                              <div className="py-4 sm:pr-4">
                                <p className="text-xs text-white/55">01</p>
                                <p className="mt-2 text-sm font-semibold uppercase">
                                  Mức giảm
                                </p>
                                <p className="mt-1 text-sm text-white/75">
                                  {slide.discountLabel}
                                </p>
                              </div>
                              <div className="border-t border-white/25 py-4 sm:border-l sm:border-t-0 sm:px-4">
                                <p className="text-xs text-white/55">02</p>
                                <p className="mt-2 text-sm font-semibold uppercase">
                                  Áp dụng
                                </p>
                                <p className="mt-1 text-sm text-white/75">
                                  Tự động
                                </p>
                              </div>
                              <div className="border-t border-white/25 py-4 sm:border-l sm:border-t-0 sm:pl-4">
                                <p className="text-xs text-white/55">03</p>
                                <p className="mt-2 text-sm font-semibold uppercase">
                                  Hiệu lực
                                </p>
                                <p className="mt-1 text-sm text-white/75">
                                  Đến {slide.endDate}
                                </p>
                              </div>
                            </div>
                            <Link
                              href={slide.ctaUrl}
                              className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:bg-neutral-200"
                            >
                              {slide.ctaLabel}
                              <ArrowRight className="size-4" />
                            </Link>
                            {campaignSlides.length > 1 ? (
                              <p className="mt-5 text-xs text-white/60">
                                {promoCurrent + 1}/{campaignSlides.length}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          </RevealSection>
        ) : null}

        <RevealSection delay={60}>
          <section
            id="new-arrivals"
            className="mx-auto w-full max-w-330 px-4 py-20 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  New arrivals
                </p>
                <h2 className="mt-3 text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-6xl">
                  Sản phẩm mới nhất
                </h2>
              </div>
              <Link
                href="/collection/cua-hang"
                className="hidden border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-60 dark:border-white dark:text-white md:inline-flex"
              >
                Xem tất cả
              </Link>
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
                    <div
                      style={{
                        animation: `fadeInUp 520ms ease ${Math.min(idx * 70, 280)}ms both`,
                      }}
                    >
                      <ProductCard
                        product={{
                          id: item.id,
                          name: item.name,
                          imageUrl: item.imageUrl,
                          minPrice: item.minPrice,
                          isNew: idx % 3 !== 0,
                          isSale: idx % 3 === 0,
                        }}
                        trackingPlacement="home_new_arrivals"
                        trackingSource="new_arrival_card"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>
        </RevealSection>

        <RevealSection delay={70}>
          <section className="py-10">
            <RecommendationShelf
              kind={isAuthenticated ? "personalized" : "home"}
              fallbackKind={isAuthenticated ? "home" : undefined}
              placement={
                isAuthenticated
                  ? "home_personalized_recommendations"
                  : "home_recommendations"
              }
              emptyMessage={
                isAuthenticated
                  ? "Chưa có đủ tương tác để cá nhân hóa gợi ý."
                  : "Chưa có gợi ý phù hợp lúc này."
              }
            />
          </section>
        </RevealSection>

        {categoryShowcases.map((group, idx) => (
          <section
            id={`category-showcase-${idx + 1}`}
            key={group.id}
            className="mx-auto w-full max-w-330 px-4 py-16 md:px-6 lg:px-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500"></p>
                <h2 className="mt-3 text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-6xl">
                  {group.name}
                </h2>
              </div>
              <a
                href={`/collection/${group.slug}`}
                className="inline-flex h-11 items-center border border-black/20 px-5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/25 dark:hover:bg-white dark:hover:text-black"
              >
                Xem nhanh
              </a>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
              <a
                href={`/collection/${group.slug}`}
                className="group relative block overflow-hidden bg-black lg:col-span-5 lg:h-full"
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
                    className="object-cover opacity-90 transition-transform duration-900 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/18 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">
                      Collection focus
                    </p>
                    <h3 className="mt-3 text-4xl font-semibold uppercase tracking-[-0.04em] md:text-6xl">
                      {group.name}
                    </h3>
                  </div>
                </div>
              </a>
              <div className="grid grid-cols-2 gap-4 lg:col-span-7 lg:h-full lg:grid-cols-3">
                {group.products.slice(0, 6).map((item) => (
                  <div key={`${group.id}-${item.id}`} className="lg:h-full">
                    <ProductCard
                      product={{
                        id: item.id,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        minPrice: item.minPrice,
                      }}
                      trackingPlacement={`home_category_${group.slug}`}
                      trackingSource="category_showcase_card"
                    />
                  </div>
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
            className="bg-[#171412] py-18 text-white dark:bg-black"
          >
            <div className="mx-auto w-full max-w-330 px-4 md:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                  Service philosophy
                </p>
                <h2 className="mt-3 text-4xl font-semibold uppercase leading-none tracking-[-0.04em] md:text-6xl">
                  Trải nghiệm mua sắm được chăm chút
                </h2>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-px bg-white/12 md:grid-cols-2 lg:grid-cols-4">
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
                      className="bg-[#171412] p-6 transition-colors hover:bg-white hover:text-black"
                      style={{
                        animation: `fadeInUp 500ms ease ${Math.min(idx * 80, 260)}ms both`,
                      }}
                    >
                      <Icon className="size-6" />
                      <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.18em]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 opacity-70">
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
                Đang tải
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
