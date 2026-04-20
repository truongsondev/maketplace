import { useMemo, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import type { ProductDetail } from "@/types/api";
import { productService, categoryService, tagService } from "@/services/api";
import { toast } from "sonner";
import { useEffect } from "react";
import type { Category, Tag } from "@/types/api";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface BasicInformationTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function BasicInformationTab({
  product,
  onUpdate,
}: BasicInformationTabProps) {
  const getAttrText = (code: string) => {
    const attr = product.productAttributes.find((item) => item.code === code);
    if (!attr || attr.value === null || attr.value === undefined) return "";
    if (Array.isArray(attr.value)) {
      return attr.value.map((item) => String(item)).join(", ");
    }
    return String(attr.value);
  };

  const getAttrArray = (code: string): string[] => {
    const attr = product.productAttributes.find((item) => item.code === code);
    if (!attr) return [];
    if (Array.isArray(attr.value)) {
      return attr.value.map((item) => String(item));
    }
    if (attr.value === null || attr.value === undefined) return [];
    const raw = String(attr.value).trim();
    return raw ? [raw] : [];
  };

  const [name, setName] = useState(product.name);
  const [detailedDescription, setDetailedDescription] = useState(
    getAttrText("product_story"),
  );
  const [careInstruction, setCareInstruction] = useState(
    getAttrText("care_instruction"),
  );
  const [fitNote, setFitNote] = useState(getAttrText("fit_note"));
  const [sizeGuideImageUrl, setSizeGuideImageUrl] = useState(
    getAttrText("size_guide_image_url"),
  );
  const [usageOccasions, setUsageOccasions] = useState<string[]>(
    getAttrArray("usage_occasions"),
  );
  const [targetAgeGroup, setTargetAgeGroup] = useState(
    getAttrText("target_age_group"),
  );
  const [basePrice, setBasePrice] = useState(product.basePrice);
  const [status, setStatus] = useState<"active" | "inactive">(
    product.status === "deleted" ? "inactive" : product.status,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product.categories.map((c) => c.id),
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    product.tags.map((t) => t.id),
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach((c) => {
      const key = c.parentId ?? "__root__";
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    });

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

  const hasChildren = (categoryId: string) => {
    return (childrenByParentId.get(categoryId) ?? []).length > 0;
  };

  const getCategoryBreadcrumb = (categoryId: string) => {
    const parts: string[] = [];
    let cursor: Category | undefined = categoriesById.get(categoryId);

    while (cursor) {
      parts.unshift(cursor.name);
      cursor = cursor.parentId
        ? categoriesById.get(cursor.parentId)
        : undefined;
    }

    return parts.join(" > ");
  };

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      if (checked) {
        if (prev.includes(categoryId)) return prev;
        return [...prev, categoryId];
      }
      return prev.filter((id) => id !== categoryId);
    });
  };

  const renderCategoryNodes = (parentId: string | null, level = 0) => {
    const key = parentId ?? "__root__";
    const nodes = childrenByParentId.get(key) ?? [];

    return nodes.map((cat) => {
      const categoryHasChildren = hasChildren(cat.id);
      return (
        <div key={cat.id} className="space-y-1">
          <label
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-50"
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.id)}
              onChange={(e) => toggleCategory(cat.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {categoryHasChildren ? "📁 " : "• "}
              {cat.name}
            </span>
          </label>

          {categoryHasChildren ? renderCategoryNodes(cat.id, level + 1) : null}
        </div>
      );
    });
  };

  const usageOccasionOptions = [
    { value: "di_lam", label: "Di làm" },
    { value: "di_choi", label: "Đi chơi" },
    { value: "tap_the_thao", label: "Tập thể thao" },
    { value: "o_nha", label: "Ở nhà" },
  ] as const;

  const ageGroupOptions = [
    { value: "10_15", label: "10-15" },
    { value: "16_25", label: "16-25" },
    { value: "25_30", label: "25-30" },
    { value: "gt_30", label: ">30" },
  ] as const;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          categoryService.getCategories(),
          tagService.getTags(),
        ]);
        setCategories(categoriesRes.data.categories);
        setTags(tagsRes.data.tags);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const productAttributes = [
        { code: "usage_occasions", value: usageOccasions },
        { code: "target_age_group", value: targetAgeGroup.trim() },
        { code: "product_story", value: detailedDescription.trim() },
        { code: "care_instruction", value: careInstruction.trim() },
        { code: "fit_note", value: fitNote.trim() },
        { code: "size_guide_image_url", value: sizeGuideImageUrl.trim() },
      ].filter((item) => {
        if (Array.isArray(item.value)) return item.value.length > 0;
        return String(item.value || "").trim().length > 0;
      });

      await productService.updateProduct(product.id, {
        name,
        basePrice,
        status,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        productAttributes,
      });
      toast.success("Đã cập nhật sản phẩm");
      onUpdate();
    } catch (error) {
      toast.error("Cập nhật sản phẩm thất bại");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Tên sản phẩm <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tên sản phẩm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Mô tả chi tiết chuẩn SEO
        </label>
        <RichTextEditor
          value={detailedDescription}
          onChange={setDetailedDescription}
          placeholder="Mô tả chi tiết về chất liệu, công năng, bối cảnh sử dụng..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Hướng dẫn bảo quản
          </label>
          <textarea
            value={careInstruction}
            onChange={(e) => setCareInstruction(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Giặt máy 30 độ, không dùng thuốc tẩy..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Ghi chú form dáng
          </label>
          <textarea
            value={fitNote}
            onChange={(e) => setFitNote(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Regular fit, lên form đẹp với dáng người từ..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Ảnh hướng dẫn chọn size (URL)
        </label>
        <input
          type="url"
          value={sizeGuideImageUrl}
          onChange={(e) => setSizeGuideImageUrl(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://.../size-guide.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Mục đích sử dụng phù hợp
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-300 p-3">
          {usageOccasionOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={usageOccasions.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setUsageOccasions((prev) => [...prev, option.value]);
                    return;
                  }
                  setUsageOccasions((prev) =>
                    prev.filter((item) => item !== option.value),
                  );
                }}
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Độ tuổi phù hợp
        </label>
        <select
          value={targetAgeGroup}
          onChange={(e) => setTargetAgeGroup(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn độ tuổi phù hợp</option>
          {ageGroupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Giá gốc (VND)
        </label>
        <input
          type="number"
          value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <p className="text-sm text-gray-600 mt-1">
          Hiển thị: {basePrice.toLocaleString()} đ
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Danh mục
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {rootCategories.length > 0 ? (
            renderCategoryNodes(null)
          ) : (
            <p className="text-sm text-gray-500">Chưa có danh mục</p>
          )}
        </div>
        {selectedCategories.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Đã chọn: {selectedCategories.map(getCategoryBreadcrumb).join("; ")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Thẻ
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTags([...selectedTags, tag.id]);
                  } else {
                    setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{tag.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Trạng thái
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="active"
              checked={status === "active"}
              onChange={(e) => setStatus(e.target.value as "active")}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Đang hoạt động</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="inactive"
              checked={status === "inactive"}
              onChange={(e) => setStatus(e.target.value as "inactive")}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Tạm ngưng</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
