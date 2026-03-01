import { useState, useRef } from "react";
import {
  Cloud,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
} from "lucide-react";

interface ProductFormData {
  name: string;
  basePrice: number;
  skuPrefix: string;
  description: string;
  category: string;
  tags: string[];
  isVisible: boolean;
}

interface ProductFormProps {
  formData: ProductFormData;
  onFormChange: (
    field: keyof ProductFormData,
    value: string | number | boolean | string[],
  ) => void;
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

export function ProductForm({
  formData,
  onFormChange,
  onImageUpload,
  imagePreview,
}: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Name */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Product Name
        </label>
        <input
          type="text"
          placeholder="e.g. Wireless Noise Cancelling Headphones"
          value={formData.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Price and SKU */}
      <div className="bg-white rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Base Price (VND)
            </label>
            <div className="flex gap-2">
              <span className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                ₫
              </span>
              <input
                type="number"
                placeholder="0"
                value={formData.basePrice}
                onChange={(e) =>
                  onFormChange("basePrice", Number(e.target.value))
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                VND
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              SKU Prefix
            </label>
            <input
              type="text"
              placeholder="e.g. HEAD-001"
              value={formData.skuPrefix}
              onChange={(e) => onFormChange("skuPrefix", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Description
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="flex gap-1 p-3 bg-gray-50 border-b border-gray-300">
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <Underline className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
          <textarea
            placeholder="Write a detailed description of the product..."
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            className="w-full p-4 focus:outline-none min-h-40"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Provide detailed information to help customers understand the product.
        </p>
      </div>

      {/* Product Media */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm">
              📁
            </span>
            Product Media
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Add from URL
          </button>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-gray-500 text-sm">
            SVG, PNG, JPG or GIF (max. 800x400px)
          </p>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-6">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Variant Tabs */}
        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 bg-orange-400 text-white rounded-lg font-medium">
            PRIMARY
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">
            SECONDARY
          </button>
        </div>
      </div>
    </div>
  );
}
