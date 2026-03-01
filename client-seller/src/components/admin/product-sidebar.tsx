import { useState } from "react";
import { X } from "lucide-react";

interface ProductFormData {
  name: string;
  basePrice: number;
  skuPrefix: string;
  description: string;
  category: string;
  tags: string[];
  isVisible: boolean;
}

interface ProductSidebarProps {
  formData: ProductFormData;
  onFormChange: (
    field: keyof ProductFormData,
    value: string | number | boolean | string[],
  ) => void;
  imagePreview: string | null;
}

export function ProductSidebar({
  formData,
  onFormChange,
  imagePreview,
}: ProductSidebarProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const newTags = [...formData.tags, tagInput.trim()];
      onFormChange("tags", newTags);
      setTagInput("");
      e.preventDefault();
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = formData.tags.filter((_, i: number) => i !== index);
    onFormChange("tags", newTags);
  };

  return (
    <div className="space-y-6">
      {/* Organization Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">📁</span>
          <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                Online Store
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => onFormChange("isVisible", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Visible to customers</p>
          </div>
        </div>
      </div>

      {/* Category Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-900">
            Category
          </label>
          <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
            + Create New
          </button>
        </div>
        <select
          value={formData.category}
          onChange={(e) => onFormChange("category", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option>Electronics</option>
          <option>Furniture</option>
          <option>Accessories</option>
          <option>Clothing</option>
        </select>
      </div>

      {/* Tags Section */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Tags
        </label>
        <input
          type="text"
          placeholder="Type and hit enter..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">SUMMARY</h3>

        <div className="space-y-4">
          <div className="flex gap-4">
            {imagePreview && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Product Name</p>
              <p className="font-semibold text-gray-900 truncate">
                {formData.name || "Unnamed Product"}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {formData.basePrice?.toLocaleString()} đ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Variants</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg p-6 space-y-3">
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <span>⬆️</span>
          Save & Publish
        </button>
        <button className="w-full bg-white border border-gray-300 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Save Draft
        </button>
        <button className="w-full text-red-600 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
