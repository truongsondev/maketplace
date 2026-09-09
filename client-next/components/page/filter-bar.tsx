"use client";

import { Search, X } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  activeFilters: string[];
  onRemoveFilter: (value: string) => void;
  onClearFilters: () => void;
}

export function FilterBar({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortChange,
  activeFilters,
  onRemoveFilter,
  onClearFilters,
}: FilterBarProps) {
  return (
    <section className="sticky top-18 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-background-light/95 dark:bg-background-dark/95 px-4 py-4 backdrop-blur-sm lg:px-10 transition-colors duration-200">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <option value="popular">Phổ biến</option>
              <option value="newest">Mới nhất</option>
              <option value="priceAsc">Giá: Thấp đến Cao</option>
              <option value="priceDesc">Giá: Cao đến Thấp</option>
              <option value="nameAsc">Tên: A-Z</option>
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => onRemoveFilter(filter)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                {filter}
                <X className="size-3" />
              </button>
            ))}
            <button
              onClick={onClearFilters}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
