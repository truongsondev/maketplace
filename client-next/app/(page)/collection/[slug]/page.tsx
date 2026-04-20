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
    "rounded-sm border border-transparent bg-transparent px-2 py-1.5 text-sm text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-white focus:border-neutral-400 focus:bg-white focus:outline-none";

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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="bg-background-light text-neutral-800 dark:bg-background-dark dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <main className="flex-1 bg-[#f5f5f5] px-4 pb-16 pt-10 md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-330">
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
            {headingTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-neutral-600 md:text-base">
            {headingDescription}
          </p>

          {normalizedCampaignQuery ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="inline-flex rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">
                Gu gợi ý: {normalizedCampaignQuery}
              </p>
              <Link
                href={`/collection/${slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                <X className="size-3.5" />
                Bỏ lọc gu
              </Link>
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {lookbookCards.map((card) => (
              <article
                key={card.id}
                className="group overflow-hidden rounded-sm bg-white shadow-sm"
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 34vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                    Bộ sưu tập
                  </p>
                  <h2 className="mt-1 text-2xl font-black uppercase">
                    {card.name}
                  </h2>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-neutral-200 py-4 text-sm text-neutral-700">
            <button
              onClick={() =>
                updateSearchParams({
                  cl: undefined,
                  uo: undefined,
                  p: undefined,
                })
              }
              className="inline-flex items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 font-medium transition-all duration-200 hover:border-neutral-300 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:text-neutral-400"
              disabled={activeFiltersCount === 0}
            >
              Bộ lọc
              {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              <X className="size-3.5" />
            </button>

            <label className="inline-flex items-center gap-2 rounded-sm px-1 py-1 transition-colors duration-200 hover:bg-neutral-100/80">
              <span>Kiểu sản phẩm</span>
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

            <label className="inline-flex items-center gap-2 rounded-sm px-1 py-1 transition-colors duration-200 hover:bg-neutral-100/80">
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

            <label className="inline-flex items-center gap-2 rounded-sm px-1 py-1 transition-colors duration-200 hover:bg-neutral-100/80">
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
              <label className="inline-flex items-center gap-1 rounded-sm px-1 py-1 font-medium transition-colors duration-200 hover:bg-neutral-100/80">
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
            <div className="mt-10 flex items-center justify-center rounded-sm bg-white p-8 text-sm font-medium text-slate-700">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang tải sản phẩm theo danh mục...
            </div>
          ) : (
            <>
              {(productsData?.products ?? []).length === 0 ? (
                <div className="mt-8 rounded-sm border border-neutral-200 bg-white p-8 text-center">
                  <p className="text-base font-semibold text-neutral-800">
                    Chưa tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    onClick={() =>
                      updateSearchParams({ cl: undefined, p: undefined })
                    }
                    className="mt-4 inline-flex items-center rounded-sm border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Xóa bộ lọc và xem lại
                  </button>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {(productsData?.products ?? []).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
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
