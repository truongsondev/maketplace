"use client";

import { Color } from "@/types/product";

interface FilterBarProps {
  colors: Color[];
  selectedColor: string | null;
  onColorChange: (colorName: string) => void;
}

export function FilterBar({
  colors,
  selectedColor,
  onColorChange,
}: FilterBarProps) {
  return (
    <section className="sticky top-18 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-background-light/95 dark:bg-background-dark/95 px-4 py-4 backdrop-blur-sm lg:px-10 transition-colors duration-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Quick Filters */}
        <div className="flex flex-nowrap gap-3 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
          <button className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:border-primary hover:text-primary dark:hover:border-primary transition-all">
            ⚙️ Bộ lọc
          </button>
          <button className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            Giá <span>▼</span>
          </button>
          <button className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            Kích cỡ <span>▼</span>
          </button>
          <button className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            Màu sắc <span>▼</span>
          </button>

          {/* Color Divider */}
          <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

          {/* Color Chips */}
          <div className="flex gap-2">
            {colors.map((color) => (
              <label
                key={color.name}
                aria-label={color.name}
                className="cursor-pointer relative flex items-center justify-center size-9 rounded-full border border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
              >
                <input
                  type="radio"
                  name="color-filter"
                  checked={selectedColor === color.name}
                  onChange={() => onColorChange(color.name)}
                  className="sr-only peer"
                />
                <span
                  className={`hidden peer-checked:block text-sm ${color.textColor}`}
                >
                  ✓
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Sắp xếp:
          </span>
          <select className="bg-transparent text-sm font-semibold text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer">
            <option>Phổ biến</option>
            <option>Mới nhất</option>
            <option>Giá: Thấp đến Cao</option>
            <option>Giá: Cao đến Thấp</option>
          </select>
        </div>
      </div>
    </section>
  );
}
