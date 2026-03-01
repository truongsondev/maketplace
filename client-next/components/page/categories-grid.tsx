"use client";

import { CategoryStat } from "@/types/product";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop";

interface CategoriesGridProps {
  categories: CategoryStat[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 aspect-[4/5] animate-pulse" />
  );
}

export function CategoriesGrid({ categories, isLoading }: CategoriesGridProps) {
  if (isLoading) {
    return (
      <section className="px-4 py-8 lg:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 lg:px-10">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 aspect-[4/5]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: `url(${cat.imageUrl ?? FALLBACK_IMAGE})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/80 transition-all" />
            <div className="absolute bottom-4 left-4 z-10">
              <h3 className="text-lg font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-neutral-300">
                {cat.productCount} Sản phẩm
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
