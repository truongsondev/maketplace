import { X, Loader2 } from "lucide-react";
import { useCategories, useTags } from "@/hooks/api";
import { useMemo, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images: ProductImage[];
}

interface ProductImage {
  id: string;
  file?: File;
  url?: string;
  altText?: string;
  sortOrder: number;
  uploading?: boolean;
}

interface ProductSidebarFormData {
  name: string;
  basePrice: number;
  simpleStockAvailable: number;
  categoryId: string;
  tagIds: string[];
  productImages: ProductImage[];
  variants: ProductVariant[];
}

interface ProductSidebarProps {
  formData: ProductSidebarFormData;
  hasVariants: boolean;
  onFormChange: (
    field: keyof ProductSidebarFormData,
    value:
      | string
      | number
      | boolean
      | string[]
      | ProductVariant[]
      | ProductImage[],
  ) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  categories: Category[];
  tags: Tag[];
  isLoadingData: boolean;
}

export function ProductSidebar({
  formData,
  hasVariants,
  onFormChange,
  onSubmit,
  isSubmitting,
}: Omit<ProductSidebarProps, "categories" | "tags" | "isLoadingData">) {
  // Use React Query hooks for data fetching
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useCategories();

  const {
    data: tagsResponse,
    isLoading: isLoadingTags,
    error: tagsError,
  } = useTags();

  // Extract data from responses
  const categories = (categoriesResponse?.data?.categories || []).filter(
    (category) => category.slug !== "cua-hang",
  );
  const tags = tagsResponse?.data?.tags || [];
  const isLoadingData = isLoadingCategories || isLoadingTags;

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach((c) => {
      const parentKey = c.parentId ?? "__root__";
      const list = map.get(parentKey) ?? [];
      list.push(c);
      map.set(parentKey, list);
    });

    // Ensure stable ordering
    for (const [key, list] of map.entries()) {
      list.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
      map.set(key, list);
    }

    return map;
  }, [categories]);

  const rootCategories = useMemo(() => {
    return childrenByParentId.get("__root__") ?? [];
  }, [childrenByParentId]);

  const [selectedRootId, setSelectedRootId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Derive selector values from categoryId when available (no setState in effect).
  const derivedSelection = useMemo(() => {
    if (!formData.categoryId) return null;

    const leaf = categoriesById.get(formData.categoryId);
    if (!leaf) return null;

    const parent = leaf.parentId ? categoriesById.get(leaf.parentId) : null;
    const grandParent = parent?.parentId
      ? categoriesById.get(parent.parentId)
      : null;

    // Expected depth: root -> group -> leaf
    if (grandParent) {
      return { rootId: grandParent.id, groupId: parent?.id ?? "" };
    }

    // root -> leaf (2 levels): the 2nd dropdown is the leaf itself
    if (parent) {
      return { rootId: parent.id, groupId: leaf.id };
    }

    // leaf is actually root
    return { rootId: leaf.id, groupId: "" };
  }, [categoriesById, formData.categoryId]);

  const effectiveRootId = derivedSelection?.rootId ?? selectedRootId;
  const effectiveGroupId = derivedSelection?.groupId ?? selectedGroupId;

  const groupCategories = useMemo(() => {
    if (!effectiveRootId) return [];
    return childrenByParentId.get(effectiveRootId) ?? [];
  }, [childrenByParentId, effectiveRootId]);

  const rootHasChildren = useMemo(() => {
    if (!effectiveRootId) return false;
    return (childrenByParentId.get(effectiveRootId) ?? []).length > 0;
  }, [childrenByParentId, effectiveRootId]);

  const leafCategories = useMemo(() => {
    if (!effectiveGroupId) return [];
    return childrenByParentId.get(effectiveGroupId) ?? [];
  }, [childrenByParentId, effectiveGroupId]);

  const handleRemoveTag = (tagId: string) => {
    const newTagIds = formData.tagIds.filter((id) => id !== tagId);
    onFormChange("tagIds", newTagIds);
  };

  // Get main product image (first image in productImages)
  const mainImage = formData.productImages[0];

  const summaryVariantCount = hasVariants ? formData.variants.length : 0;
  const summaryTotalStock = hasVariants
    ? formData.variants.reduce(
        (total, variant) => total + variant.stockAvailable,
        0,
      )
    : formData.simpleStockAvailable;

  const handleTagSelect = (tagId: string) => {
    if (!formData.tagIds.includes(tagId)) {
      const newTagIds = [...formData.tagIds, tagId];
      onFormChange("tagIds", newTagIds);
    }
  };

  // Show error states
  if (categoriesError) {
    console.error("Error loading categories:", categoriesError);
  }
  if (tagsError) {
    console.error("Error loading tags:", tagsError);
  }

  return (
    <div className="space-y-6">
      {/* Organization Section */}
      {/* Visibility Section - Removed since isVisible is not in the API */}

      {/* Category Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-900">
            Danh mục
          </label>
          <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
            + Tạo mới
          </button>
        </div>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={effectiveRootId}
              onChange={(e) => {
                const nextRootId = e.target.value;
                setSelectedRootId(nextRootId);
                setSelectedGroupId("");

                if (!nextRootId) {
                  onFormChange("categoryId", "");
                  return;
                }

                // If the selected root category has no children, treat it as the final category.
                const children = childrenByParentId.get(nextRootId) ?? [];
                if (children.length === 0) {
                  onFormChange("categoryId", nextRootId);
                } else {
                  onFormChange("categoryId", "");
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Chọn danh mục lớn</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {effectiveRootId && rootHasChildren ? (
              <>
                <select
                  value={effectiveGroupId}
                  onChange={(e) => {
                    const nextGroupId = e.target.value;
                    setSelectedGroupId(nextGroupId);

                    if (!nextGroupId) {
                      onFormChange("categoryId", "");
                      return;
                    }

                    // If the selected group has no children, treat it as the final category.
                    const children = childrenByParentId.get(nextGroupId) ?? [];
                    if (children.length === 0) {
                      onFormChange("categoryId", nextGroupId);
                    } else {
                      onFormChange("categoryId", "");
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Chọn nhóm danh mục</option>
                  {groupCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {effectiveGroupId && leafCategories.length > 0 ? (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => onFormChange("categoryId", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Chọn danh mục con</option>
                    {leafCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-900">
            Thẻ
          </label>
          <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
            + Tạo mới
          </button>
        </div>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <>
            <select
              value=""
              onChange={(e) => {
                if (
                  e.target.value &&
                  !formData.tagIds.includes(e.target.value)
                ) {
                  handleTagSelect(e.target.value);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-3"
            >
              <option value="">Chọn thẻ</option>
              {tags
                .filter((tag) => !formData.tagIds.includes(tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-2">
              {formData.tagIds.map((tagId: string) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-sm"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tagId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tổng quan</h3>

        <div className="space-y-4">
          <div className="flex gap-4">
            {mainImage?.url && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={mainImage.url}
                  alt="Sản phẩm"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Tên sản phẩm</p>
              <p className="font-semibold text-gray-900 truncate">
                {formData.name || "Sản phẩm chưa đặt tên"}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {formData.basePrice?.toLocaleString()} đ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Phiên bản</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryVariantCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng tồn kho</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryTotalStock}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg p-6 space-y-3">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo sản phẩm...
            </>
          ) : (
            <>
              <span>⬆️</span>
              Lưu & Xuất bản
            </>
          )}
        </button>
        <button
          disabled={isSubmitting}
          className="w-full bg-white border border-gray-300 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Lưu bản nháp
        </button>
        <button
          disabled={isSubmitting}
          className="w-full text-red-600 py-2 rounded-lg font-semibold hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
