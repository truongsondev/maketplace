"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CategoryStat } from "@/types/product";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop";

interface CategoriesGridProps {
  categories: CategoryStat[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 aspect-4/5 animate-pulse" />
  );
}

export function CategoriesGrid({ categories, isLoading }: CategoriesGridProps) {
  const [itemsPerView, setItemsPerView] = useState(4);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setItemsPerView(2);
        return;
      }

      if (width < 1024) {
        setItemsPerView(3);
        return;
      }

      setItemsPerView(4);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);

    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(categories.length / itemsPerView)),
    [categories.length, itemsPerView],
  );

  useEffect(() => {
    if (totalPages <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [totalPages]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <section className="px-4 py-8 lg:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 lg:px-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Danh mục nổi bật
        </h2>
        {categories.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  prev === 0 ? totalPages - 1 : prev - 1,
                )
              }
              aria-label="Xem nhóm danh mục trước"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => (prev + 1) % totalPages)
              }
              aria-label="Xem nhóm danh mục tiếp theo"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="shrink-0 px-2"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <Link
                href={`/category/${cat.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 aspect-4/5"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${cat.imageUrl ?? FALLBACK_IMAGE})`,
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent group-hover:from-black/80 transition-all" />
                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                  <p className="text-xs text-neutral-300">
                    {cat.productCount} Sản phẩm
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {categories.length > itemsPerView && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              aria-label={`Đến nhóm danh mục ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentPage
                  ? "w-8 bg-primary"
                  : "w-2 bg-neutral-300 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
