"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { ProductCard } from "@/components/page/product-card";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80";

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
      "/upload/f_auto,q_auto,c_fill,w_1400,h_1000/",
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

export default function CategoryCollectionPage() {
  const [isDark, setIsDark] = useState(false);
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug ?? "");
  const campaignQuery = searchParams.get("q")?.trim() ?? "";
  const campaignScope = searchParams.get("scope")?.trim() ?? "";
  const selectedColor = searchParams.get("cl")?.trim() ?? "";
  const selectedUsageOccasion = searchParams.get("uo")?.trim() ?? "";
  const selectedPriceRange = searchParams.get("p")?.trim() ?? "";
  const selectedSort = searchParams.get("sort")?.trim() || "createdAt:desc";
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isAllScopeCampaign = campaignScope === "all";
  const categoryFilter = isAllScopeCampaign ? undefined : slug;

  const { data: categories = [] } = useCategories(true);
  const { data: productsData, isLoading } = useProducts({
    c: categoryFilter,
    q: campaignQuery || undefined,
    cl: selectedColor || undefined,
    uo: selectedUsageOccasion || undefined,
    p: selectedPriceRange || undefined,
    sort: selectedSort,
    page: 1,
    limit: 20,
  });

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCartSummary(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === slug),
    [categories, slug],
  );

  const normalizedCampaignQuery = campaignQuery.replace(/\s+/g, " ").trim();
  const activeFiltersCount = [
    selectedColor,
    selectedUsageOccasion,
    selectedPriceRange,
  ].filter(Boolean).length;

  const priceOptions = [
    { value: "", label: "Mọi mức giá" },
    { value: "0-500000", label: "Dưới 500.000đ" },
    { value: "500000-1000000", label: "500.000đ - 1.000.000đ" },
    { value: "1000000-3000000", label: "1.000.000đ - 3.000.000đ" },
    { value: "3000000-", label: "Trên 3.000.000đ" },
  ];

  const filterSelectClassName =
    "border border-transparent bg-transparent px-2 py-1.5 text-sm text-neutral-700 transition-all duration-200 hover:border-black/15 hover:bg-white/65 focus:border-black/35 focus:bg-white/85 focus:outline-none dark:text-neutral-100 dark:hover:bg-white/10";

  const updateSearchParams = (
    nextParams: Record<string, string | undefined>,
  ) => {
    const merged = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (!value) {
        merged.delete(key);
      } else {
        merged.set(key, value);
      }
    });

    const query = merged.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleCollectionChange = (nextSlug: string) => {
    if (!nextSlug || nextSlug === slug) return;

    const merged = new URLSearchParams(searchParams.toString());
    merged.delete("s");
    merged.delete("cl");
    merged.delete("p");
    merged.delete("scope");

    const query = merged.toString();
    router.push(
      query ? `/collection/${nextSlug}?${query}` : `/collection/${nextSlug}`,
    );
  };

  const headingTitle =
    !isAllScopeCampaign && selectedCategory?.name
      ? `${selectedCategory.name}: Bộ Sưu Tập Dành Cho Bạn`
      : normalizedCampaignQuery
        ? "Gợi Ý Theo Phong Cách"
        : "Trang phục: Thời Trang Thông Minh, Tiện Nghi Vị Nhân Sinh";

  const headingDescription = normalizedCampaignQuery
    ? `Các sản phẩm phù hợp với gu \"${normalizedCampaignQuery}\".`
    : "Khám phá các thiết kế mới, dễ phối và phù hợp cho nhiều lịch trình.";

  const lookbookCards = useMemo(() => {
    if (isAllScopeCampaign || !selectedCategory) {
      if (!normalizedCampaignQuery) {
        return categories.slice(0, 1).map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: normalizeProductImageUrl(item.imageUrl),
        }));
      }

      return [
        {
          id: `campaign-${slug}`,
          name: `Gu: ${normalizedCampaignQuery}`,
          imageUrl: normalizeProductImageUrl(
            productsData?.products?.[0]?.imageUrl ?? null,
          ),
        },
      ];
    }

    const selected = {
      id: selectedCategory.id,
      name: selectedCategory.name,
      imageUrl: normalizeProductImageUrl(selectedCategory.imageUrl),
    };

    return [selected].filter(Boolean) as Array<{
      id: string;
      name: string;
      imageUrl: string;
    }>;
  }, [
    categories,
    isAllScopeCampaign,
    normalizedCampaignQuery,
    productsData?.products,
    selectedCategory,
    slug,
  ]);

  const cartCount = cartSummary?.totalItems ?? 0;
  const editorialImageUrl = normalizeProductImageUrl(
    productsData?.products?.[0]?.imageUrl ??
      lookbookCards[0]?.imageUrl ??
      selectedCategory?.imageUrl ??
      null,
  );

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
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <main className="-mt-18.25 flex-1 pb-20 pt-34">
        <div className="luxury-container">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl"
          >
            <p className="luxury-eyebrow">Collection edit</p>
            <h1 className="luxury-title mt-4">{headingTitle}</h1>
            <p className="luxury-copy mt-5 max-w-3xl">{headingDescription}</p>
          </motion.header>

          {normalizedCampaignQuery ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="inline-flex border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
                Gu gợi ý: {normalizedCampaignQuery}
              </p>
              <Link
                href={`/collection/${slug}`}
                className="inline-flex items-center gap-1 border border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:bg-white/70"
              >
                <X className="size-3.5" />
                Bỏ lọc gu
              </Link>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-4xl">
            {lookbookCards.map((card) => (
              <motion.article
                key={card.id}
                className="group overflow-hidden bg-black"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 34vw"
                    className="object-cover opacity-88 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
                      Bộ sưu tập
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold uppercase tracking-[-0.04em]">
                      {card.name}
                    </h2>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-black/10 py-5 text-sm text-neutral-700 dark:border-white/10 dark:text-neutral-200">
            <button
              onClick={() =>
                updateSearchParams({
                  cl: undefined,
                  uo: undefined,
                  p: undefined,
                })
              }
              className="inline-flex items-center gap-1 border border-transparent px-2 py-1.5 font-medium transition-all duration-200 hover:border-black/15 hover:bg-white/65 hover:text-black disabled:cursor-not-allowed disabled:text-neutral-400"
              disabled={activeFiltersCount === 0}
            >
              Bộ lọc
              {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              <X className="size-3.5" />
            </button>

            <label className="inline-flex items-center gap-2 px-1 py-1 transition-colors duration-200 hover:bg-white/45">
              <span>Mức giá</span>
              <select
                value={selectedPriceRange}
                onChange={(event) =>
                  updateSearchParams({ p: event.target.value || undefined })
                }
                className={filterSelectClassName}
              >
                {priceOptions.map((option) => (
                  <option
                    key={option.value || "all-price"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 px-1 py-1 transition-colors duration-200 hover:bg-white/45">
              <span>Bộ sưu tập</span>
              <select
                value={slug}
                onChange={(event) => handleCollectionChange(event.target.value)}
                className={filterSelectClassName}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 px-1 py-1 transition-colors duration-200 hover:bg-white/45">
              <span>Màu sắc</span>
              <select
                value={selectedColor}
                onChange={(event) =>
                  updateSearchParams({ cl: event.target.value || undefined })
                }
                className={filterSelectClassName}
              >
                <option value="">Tất cả</option>
                {(productsData?.aggregations?.colors ?? []).map((color) => (
                  <option key={color.value} value={color.label}>
                    {color.label} ({color.count})
                  </option>
                ))}
              </select>
            </label>
            <div className="ml-auto inline-flex items-center gap-3">
              <span className="text-neutral-500">Sắp xếp theo:</span>
              <label className="inline-flex items-center gap-1 px-1 py-1 font-medium transition-colors duration-200 hover:bg-white/45">
                <select
                  value={selectedSort}
                  onChange={(event) =>
                    updateSearchParams({
                      sort: event.target.value || "createdAt:desc",
                    })
                  }
                  className={filterSelectClassName}
                >
                  <option value="createdAt:desc">Ngày (từ mới đến cũ)</option>
                  <option value="createdAt:asc">Ngày (từ cũ đến mới)</option>
                </select>
                <ChevronDown className="size-4 text-neutral-500" />
              </label>
              <span className="text-neutral-500">
                {productsData?.pagination?.total ?? 0} sản phẩm
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="luxury-panel mt-10 flex items-center justify-center p-8 text-sm font-medium text-neutral-700">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang tải sản phẩm theo danh mục...
            </div>
          ) : (
            <>
              {(productsData?.products ?? []).length === 0 ? (
                <div className="luxury-panel mt-8 p-10 text-center">
                  <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    Chưa tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    onClick={() =>
                      updateSearchParams({ cl: undefined, p: undefined })
                    }
                    className="luxury-button-ghost mt-5"
                  >
                    Xóa bộ lọc và xem lại
                  </button>
                </div>
              ) : (
                <div className="mt-10">
                  <section className="mb-12 grid overflow-hidden bg-neutral-950 text-white md:grid-cols-[0.85fr_1.15fr]">
                    <div className="flex flex-col justify-center px-6 py-10 md:px-10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
                        Wardrobe direction
                      </p>
                      <h2 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.05em] md:text-6xl">
                        Chọn ít hơn, mặc lâu hơn
                      </h2>
                      <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
                        Bộ sưu tập được sắp theo form dáng, chất liệu và nhịp sử
                        dụng để việc chọn đồ giống một buổi biên tập tủ đồ,
                        không phải lướt danh sách sản phẩm.
                      </p>
                    </div>
                    <div className="relative min-h-[340px]">
                      <Image
                        src={editorialImageUrl}
                        alt="Collection editorial"
                        fill
                        sizes="(max-width: 768px) 100vw, 55vw"
                        className="object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/10" />
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
                    {(productsData?.products ?? []).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
