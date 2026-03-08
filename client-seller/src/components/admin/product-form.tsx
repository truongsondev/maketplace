import { useState, useRef } from "react";
import {
  Cloud,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";

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

interface ProductFormFormData {
  name: string;
  basePrice: number;
  description: string;
  categoryId: string;
  tagIds: string[];
  productImages: ProductImage[];
  variants: ProductVariant[];
}

interface ProductFormProps {
  formData: ProductFormFormData;
  onFormChange: (
    field: keyof ProductFormFormData,
    value:
      | string
      | number
      | boolean
      | string[]
      | ProductVariant[]
      | ProductImage[],
  ) => void;
  onImageUpload: (file: File, variantId: string | "product") => void;
  onRemoveImage: (variantId: string | "product", imageId: string) => void;
  onVariantChange: (
    variantId: string,
    field: string,
    value:
      | string
      | number
      | boolean
      | Record<string, string | number | boolean>,
  ) => void;
  onAddVariant: () => void;
  onRemoveVariant: (variantId: string) => void;
}

export function ProductForm({
  formData,
  onFormChange,
  onImageUpload,
  onRemoveImage,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
}: ProductFormProps) {
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string>(
    formData.variants[0]?.id || "",
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleProductDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageUpload(file, "product");
      }
    }
  };

  const handleVariantDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && activeVariantId) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageUpload(file, activeVariantId);
      }
    }
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0], "product");
    }
  };

  const handleVariantFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeVariantId) {
      onImageUpload(e.target.files[0], activeVariantId);
    }
  };

  const activeVariant = formData.variants.find((v) => v.id === activeVariantId);

  return (
    <div className="space-y-8">
      {/* Product Name */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Tên sản phẩm
        </label>
        <input
          type="text"
          placeholder="ví dụ: Tai nghe không dây chống ồn"
          value={formData.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Price */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Giá gốc (VND)
        </label>
        <div className="flex gap-2">
          <span className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
            ₫
          </span>
          <input
            type="number"
            placeholder="0"
            value={formData.basePrice}
            onChange={(e) => onFormChange("basePrice", Number(e.target.value))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
            VND
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Đây sẽ là giá mặc định cho tất cả các phiên bản
        </p>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Mô tả
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
            placeholder="Viết mô tả chi tiết về sản phẩm..."
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            className="w-full p-4 focus:outline-none min-h-40"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Cung cấp thông tin chi tiết để giúp khách hàng hiểu sản phẩm.
        </p>
      </div>

      {/* Product Main Image */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-sm">
              ⭐
            </span>
            Ảnh chính sản phẩm
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Đây là ảnh chính sẽ hiển thị khi khách hàng xem sản phẩm (chỉ chọn 1
          ảnh)
        </p>

        {/* Upload Area for Product */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleProductDrop}
          onClick={() => productFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={productFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProductFileChange}
            className="hidden"
          />
          <Cloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-900 font-medium mb-1 text-sm">
            Nhấp để tải lên hoặc kéo thả
          </p>
          <p className="text-gray-500 text-xs">
            PNG, JPG hoặc GIF (khuyến nghị 800x800px)
          </p>
        </div>

        {/* Product Image Gallery */}
        {formData.productImages.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-3">
              {formData.productImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-orange-500">
                    {image.uploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={image.altText || "Product main image"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {!image.uploading && (
                    <>
                      <button
                        onClick={() => onRemoveImage("product", image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Ảnh chính
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Variant Images */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm">
              📁
            </span>
            Ảnh phiên bản sản phẩm
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Thêm ảnh riêng cho từng phiên bản (màu sắc, kích thước khác nhau...)
        </p>

        {/* Variant Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn phiên bản để thêm ảnh
          </label>
          <select
            value={activeVariantId}
            onChange={(e) => setActiveVariantId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {formData.variants.map((variant, index) => (
              <option key={variant.id} value={variant.id}>
                Phiên bản {index + 1} {variant.sku && `(${variant.sku})`}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Area for Variant */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleVariantDrop}
          onClick={() => variantFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={variantFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleVariantFileChange}
            className="hidden"
          />
          <Cloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-900 font-medium mb-1 text-sm">
            Nhấp để tải lên hoặc kéo thả
          </p>
          <p className="text-gray-500 text-xs">
            PNG, JPG hoặc GIF (khuyến nghị 800x800px)
          </p>
        </div>

        {/* Image Gallery for Active Variant */}
        {activeVariant && activeVariant.images.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Ảnh của phiên bản này ({activeVariant.images.length})
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {activeVariant.images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {image.uploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={image.altText || "Variant image"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {!image.uploading && (
                    <button
                      onClick={() => onRemoveImage(activeVariantId, image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Variants */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-sm">
              📦
            </span>
            Phiên bản sản phẩm
          </h3>
          <button
            onClick={onAddVariant}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Thêm phiên bản
          </button>
        </div>

        <div className="space-y-4">
          {formData.variants.map((variant, index) => (
            <div
              key={variant.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  Phiên bản {index + 1}
                </h4>
                {formData.variants.length > 1 && (
                  <button
                    onClick={() => onRemoveVariant(variant.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã SKU
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: SANPHAM-001"
                    value={variant.sku}
                    onChange={(e) =>
                      onVariantChange(variant.id, "sku", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={variant.price}
                    onChange={(e) =>
                      onVariantChange(
                        variant.id,
                        "price",
                        Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={variant.stockAvailable}
                    onChange={(e) =>
                      onVariantChange(
                        variant.id,
                        "stockAvailable",
                        Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tồn kho tối thiểu
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={variant.minStock || 0}
                  onChange={(e) =>
                    onVariantChange(
                      variant.id,
                      "minStock",
                      Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thuộc tính sản phẩm
                </label>

                {/* Fixed attributes: Color and Size */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Màu sắc
                      </label>
                      <input
                        type="text"
                        placeholder="vd: Đỏ"
                        value={String(variant.attributes.color || "")}
                        onChange={(e) => {
                          onVariantChange(variant.id, "attributes", {
                            ...variant.attributes,
                            color: e.target.value,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Kích thước
                      </label>
                      <input
                        type="text"
                        placeholder="vd: L"
                        value={String(variant.attributes.size || "")}
                        onChange={(e) => {
                          onVariantChange(variant.id, "attributes", {
                            ...variant.attributes,
                            size: e.target.value,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional custom attributes */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Thuộc tính khác (tùy chọn)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newKey = `thuoc_tinh_${Object.keys(variant.attributes).length + 1}`;
                        onVariantChange(variant.id, "attributes", {
                          ...variant.attributes,
                          [newKey]: "",
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Thêm thuộc tính
                    </button>
                  </div>

                  {/* Attribute Key-Value List (excluding color and size) */}
                  <div className="space-y-2">
                    {Object.entries(variant.attributes).length > 0 ? (
                      Object.entries(variant.attributes).map(
                        ([key, value], attrIndex) => (
                          <div
                            key={`${variant.id}-attr-${attrIndex}`}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              placeholder="Tên thuộc tính (vd: màu_sắc)"
                              value={key}
                              onBlur={(e) => {
                                const newKey = e.target.value.trim();
                                if (newKey && newKey !== key) {
                                  const newAttrs = { ...variant.attributes };
                                  delete newAttrs[key];
                                  newAttrs[newKey] = value;
                                  onVariantChange(
                                    variant.id,
                                    "attributes",
                                    newAttrs,
                                  );
                                }
                              }}
                              onChange={(e) => {
                                // Chỉ update ngay lập tức value, không thay đổi key
                                const currentInput = e.target;
                                currentInput.dataset.pendingKey =
                                  e.target.value;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Giá trị (vd: đỏ)"
                              value={String(value)}
                              onChange={(e) => {
                                onVariantChange(variant.id, "attributes", {
                                  ...variant.attributes,
                                  [key]: e.target.value,
                                });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newAttrs = { ...variant.attributes };
                                delete newAttrs[key];
                                onVariantChange(
                                  variant.id,
                                  "attributes",
                                  newAttrs,
                                );
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Xóa thuộc tính"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-gray-500 italic py-2">
                        Chưa có thuộc tính bổ sung. Nhấn "Thêm thuộc tính" để
                        thêm thuộc tính khác.
                      </p>
                    )}
                  </div>
                </div>

                {/* Examples */}
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-800 font-medium mb-1">
                    💡 Ví dụ thuộc tính:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>
                      • <strong>màu_sắc:</strong> đỏ, xanh, vàng
                    </li>
                    <li>
                      • <strong>kích_thước:</strong> S, M, L, XL
                    </li>
                    <li>
                      • <strong>chất_liệu:</strong> cotton, polyester
                    </li>
                    <li>
                      • <strong>dung_lượng:</strong> 128GB, 256GB
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
