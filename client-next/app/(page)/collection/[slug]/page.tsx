"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
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
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug ?? "");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: categories = [] } = useCategories(true);
  const { data: productsData, isLoading } = useProducts({
    c: slug,
    sort: "createdAt:desc",
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

  const lookbookCards = useMemo(() => {
    const selected = selectedCategory
      ? {
          id: selectedCategory.id,
          name: selectedCategory.name,
          imageUrl: normalizeProductImageUrl(selectedCategory.imageUrl),
        }
      : null;

    const others = categories
      .filter((item) => item.slug !== slug)
      .slice(0, 1)
      .map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: normalizeProductImageUrl(item.imageUrl),
      }));

    return [selected, ...others].filter(Boolean) as Array<{
      id: string;
      name: string;
      imageUrl: string;
    }>;
  }, [categories, selectedCategory, slug]);

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
            {selectedCategory?.name ?? "Trang phục"}: Thời Trang Thông Minh,
            Tiện Nghi Vị Nhân Sinh
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {lookbookCards.map((card) => (
              <article
                key={card.id}
                className="group overflow-hidden rounded-sm bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
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
            {[
              "Bộ lọc",
              "Kiểu sản phẩm",
              "Bộ sưu tập",
              "Màu sắc",
              "Phom dáng",
            ].map((filter) => (
              <button
                key={filter}
                className="inline-flex items-center gap-1 hover:text-black"
              >
                {filter}
                <ChevronDown className="size-4" />
              </button>
            ))}
            <div className="ml-auto inline-flex items-center gap-3">
              <span className="text-neutral-500">Sắp xếp theo:</span>
              <span className="inline-flex items-center gap-1 font-medium">
                Ngày (từ mới đến cũ)
                <ChevronDown className="size-4" />
              </span>
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
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {(productsData?.products ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
