import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import type { ProductDetail } from "@/types/api";
import { productService, categoryService, tagService } from "@/services/api";
import { toast } from "sonner";
import { useEffect } from "react";
import type { Category, Tag } from "@/types/api";

interface BasicInformationTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function BasicInformationTab({
  product,
  onUpdate,
}: BasicInformationTabProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
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
      await productService.updateProduct(product.id, {
        name,
        description,
        basePrice,
        status,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
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
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mô tả sản phẩm"
        />
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
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, cat.id]);
                  } else {
                    setSelectedCategories(
                      selectedCategories.filter((id) => id !== cat.id),
                    );
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
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
