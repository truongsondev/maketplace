import { useState, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { categoryService, tagService } from "@/services/api";
import type { ProductListFilters, Category, Tag } from "@/types/api";

interface ProductFiltersProps {
  filters: ProductListFilters;
  aggregations: {
    statusCount: { active: number; inactive: number; deleted: number };
    stockStatus: { all: number; low: number; out: number };
  };
  onFilterChange: (filters: Partial<ProductListFilters>) => void;
}

export function ProductFilters({
  filters,
  aggregations,
  onFilterChange,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          categoryService.getCategories(),
          tagService.getTags(),
        ]);
        setCategories(categoriesRes.data.categories);
        console.log(tags);
        setTags(tagsRes.data.tags);
      } catch (error) {
        console.error("Failed to load filter data", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        onFilterChange({ search: searchQuery || undefined });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    onFilterChange({
      search: undefined,
      categoryId: undefined,
      status: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      stockStatus: undefined,
      tagIds: undefined,
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.categoryId,
    filters.status,
    filters.minPrice,
    filters.maxPrice,
    filters.stockStatus !== "all" ? filters.stockStatus : null,
    filters.tagIds,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <select
            value={filters.categoryId || ""}
            onChange={(e) =>
              onFilterChange({ categoryId: e.target.value || undefined })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.status || ""}
            onChange={(e) => {
              const value = e.target.value as
                | ""
                | "active"
                | "inactive"
                | "deleted";
              onFilterChange({
                status: value || undefined,
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">
              Active ({aggregations.statusCount.active})
            </option>
            <option value="inactive">
              Inactive ({aggregations.statusCount.inactive})
            </option>
            <option value="deleted">
              Deleted ({aggregations.statusCount.deleted})
            </option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.stockStatus || "all"}
            onChange={(e) => {
              const value = e.target.value as "all" | "low" | "out";
              onFilterChange({
                stockStatus: value,
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              All Stock ({aggregations.stockStatus.all})
            </option>
            <option value="low">
              Low Stock ({aggregations.stockStatus.low})
            </option>
            <option value="out">
              Out of Stock ({aggregations.stockStatus.out})
            </option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min price"
            value={filters.minPrice || ""}
            onChange={(e) =>
              onFilterChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max price"
            value={filters.maxPrice || ""}
            onChange={(e) =>
              onFilterChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
