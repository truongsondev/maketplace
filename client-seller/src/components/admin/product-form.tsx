import { useState, useRef } from "react";
import { Cloud, Plus, Trash2, X } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

const formatVndNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return Math.trunc(value).toLocaleString("vi-VN");
};

const parseVndInputToNumber = (raw: string) => {
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
};

interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images: ProductImage[];
}

const AXIS_ATTRIBUTE_KEYS = new Set(["color", "size"]);

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
  simpleStockAvailable: number;
  detailedDescription: string;
  careInstruction: string;
  fitNote: string;
  categoryId: string;
  tagIds: string[];
  usageOccasions: string[];
  targetAgeGroup: string;
  sizeGuideImage: ProductImage | null;
  productImages: ProductImage[];
  variants: ProductVariant[];
}

interface ProductFormProps {
  formData: ProductFormFormData;
  hasVariants?: boolean;
  onHasVariantsChange?: (next: boolean) => void;
  axisAttributes: Array<{
    id: string;
    code: string;
    name: string;
    dataType: string;
    unit: string | null;
    axisOrder: number | null;
  }>;
  onFormChange: (
    field: keyof ProductFormFormData,
    value:
      | string
      | number
      | boolean
      | string[]
      | ProductVariant[]
      | ProductImage[]
      | ProductImage
      | null,
  ) => void;
  onImageUpload: (
    file: File,
    variantId: string | "product" | "size-guide",
  ) => void;
  onRemoveImage: (
    variantId: string | "product" | "size-guide",
    imageId: string,
  ) => void;
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
  hasVariants = true,
  onHasVariantsChange,
  axisAttributes,
  onFormChange,
  onImageUpload,
  onRemoveImage,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
}: ProductFormProps) {
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

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const sizeGuideFileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string>(
    formData.variants[0]?.id || "",
  );

  const axisAttributeKeys = new Set(axisAttributes.map((a) => a.code));
  const reservedAttributeKeys = new Set([
    ...Array.from(AXIS_ATTRIBUTE_KEYS),
    ...Array.from(axisAttributeKeys),
  ]);

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
      <div className="bg-white rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Cách bán sản phẩm
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-md border border-gray-200 p-3 cursor-pointer">
            <input
              type="radio"
              name="product-sale-mode"
              checked={!hasVariants}
              onChange={() => onHasVariantsChange?.(false)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Không biến thể
              </p>
              <p className="text-xs text-gray-500">
                Sản phẩm chỉ có một mức giá, không phân màu/size theo phiên bản.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-md border border-gray-200 p-3 cursor-pointer">
            <input
              type="radio"
              name="product-sale-mode"
              checked={hasVariants}
              onChange={() => onHasVariantsChange?.(true)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Có biến thể</p>
              <p className="text-xs text-gray-500">
                Sản phẩm có nhiều phiên bản khác nhau theo thuộc tính như màu,
                size.
              </p>
            </div>
          </label>
        </div>
      </div>

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
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatVndNumber(formData.basePrice)}
            onChange={(e) =>
              onFormChange("basePrice", parseVndInputToNumber(e.target.value))
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
            VND
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {hasVariants
            ? "Đây sẽ là giá mặc định cho tất cả các phiên bản"
            : "Đây là giá bán cho sản phẩm không biến thể"}
        </p>

        {!hasVariants ? (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tồn kho sản phẩm
            </label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={formData.simpleStockAvailable}
              onChange={(e) =>
                onFormChange("simpleStockAvailable", Number(e.target.value))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Dùng cho mode không biến thể. Hệ thống sẽ tự tạo phiên bản mặc
              định nội bộ.
            </p>
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          Nội dung chi tiết
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Mô tả chi tiết chuẩn SEO
          </label>
          <RichTextEditor
            value={formData.detailedDescription}
            onChange={(nextValue) =>
              onFormChange("detailedDescription", nextValue)
            }
            placeholder="Nên gồm chất liệu, cảm giác mặc, bối cảnh sử dụng và lợi ích nổi bật..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Hướng dẫn bảo quản
            </label>
            <textarea
              placeholder="Giặt nhẹ 30 độ, không tẩy, phơi nơi thoáng mát..."
              value={formData.careInstruction}
              onChange={(e) => onFormChange("careInstruction", e.target.value)}
              className="w-full min-h-24 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ghi chú form dáng
            </label>
            <textarea
              placeholder="Regular fit, phù hợp dáng người từ 45-70kg..."
              value={formData.fitNote}
              onChange={(e) => onFormChange("fitNote", e.target.value)}
              className="w-full min-h-24 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Usage & Age Fit */}
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Mục đích sử dụng phù hợp
          </label>
          <div className="grid grid-cols-2 gap-3">
            {usageOccasionOptions.map((option) => {
              const checked = formData.usageOccasions.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFormChange("usageOccasions", [
                          ...formData.usageOccasions,
                          option.value,
                        ]);
                        return;
                      }

                      onFormChange(
                        "usageOccasions",
                        formData.usageOccasions.filter(
                          (value) => value !== option.value,
                        ),
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Độ tuổi phù hợp
          </label>
          <select
            value={formData.targetAgeGroup}
            onChange={(e) => onFormChange("targetAgeGroup", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Chọn độ tuổi phù hợp</option>
            {ageGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
                        alt={image.altText || "Ảnh chính sản phẩm"}
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

      <div className="bg-white rounded-lg p-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Ảnh hướng dẫn chọn size
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Tải lên 1 ảnh bảng size để khách dễ chọn kích thước phù hợp.
        </p>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith("image/")) {
                onImageUpload(file, "size-guide");
              }
            }
          }}
          onClick={() => sizeGuideFileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={sizeGuideFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onImageUpload(e.target.files[0], "size-guide");
              }
            }}
            className="hidden"
          />
          <Cloud className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-900">
            Nhấp để chọn ảnh bảng size
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG (khuyến nghị tỉ lệ 3:4 hoặc 4:5)
          </p>
        </div>

        {formData.sizeGuideImage?.url ? (
          <div className="relative mt-4 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200">
            <img
              src={formData.sizeGuideImage.url}
              alt={formData.sizeGuideImage.altText || "Ảnh hướng dẫn chọn size"}
              className="h-auto w-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                onRemoveImage("size-guide", formData.sizeGuideImage!.id)
              }
              className="absolute right-2 top-2 rounded bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Variant Images */}
      {hasVariants ? (
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
                          alt={image.altText || "Ảnh phiên bản"}
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
      ) : (
        <div className="bg-white rounded-lg p-6">
          <p className="text-sm text-gray-600">
            Chế độ không biến thể đang được bật. Ảnh theo phiên bản và danh sách
            phiên bản sẽ được ẩn.
          </p>
        </div>
      )}

      {/* Product Variants */}
      {hasVariants ? (
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
            {formData.variants.map((variant, index) => {
              const extraAttributes = Object.entries(variant.attributes).filter(
                ([key]) => !reservedAttributeKeys.has(key),
              );

              return (
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
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatVndNumber(variant.price)}
                        onChange={(e) =>
                          onVariantChange(
                            variant.id,
                            "price",
                            parseVndInputToNumber(e.target.value),
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
                      {axisAttributes.length > 0 ? (
                        <div
                          className={
                            axisAttributes.length >= 2
                              ? "grid grid-cols-2 gap-3"
                              : "grid grid-cols-1 gap-3"
                          }
                        >
                          {axisAttributes.map((attr) => {
                            const placeholder =
                              attr.code === "color"
                                ? "vd: Đỏ"
                                : attr.code === "size"
                                  ? "vd: L"
                                  : "vd: ...";

                            return (
                              <div key={attr.id}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {attr.name}
                                </label>
                                <input
                                  type="text"
                                  placeholder={placeholder}
                                  value={String(
                                    variant.attributes[attr.code] || "",
                                  )}
                                  onChange={(e) => {
                                    onVariantChange(variant.id, "attributes", {
                                      ...variant.attributes,
                                      [attr.code]: e.target.value,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Sản phẩm này không có thuộc tính biến thể theo danh
                          mục đã chọn.
                        </p>
                      )}
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
                            const baseIndex =
                              Object.keys(variant.attributes).length + 1;
                            let newKey = `thuoc_tinh_${baseIndex}`;
                            while (
                              reservedAttributeKeys.has(newKey) ||
                              newKey in variant.attributes
                            ) {
                              newKey = `thuoc_tinh_${Math.floor(Math.random() * 100000)}`;
                            }
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
                        {extraAttributes.length > 0 ? (
                          extraAttributes.map(([key, value], attrIndex) => (
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
                                    if (reservedAttributeKeys.has(newKey)) {
                                      // Do not allow overriding reserved axis keys.
                                      return;
                                    }

                                    if (newKey in variant.attributes) {
                                      // Avoid clobbering another attribute.
                                      return;
                                    }

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
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic py-2">
                            Chưa có thuộc tính bổ sung. Nhấn "Thêm thuộc tính"
                            để thêm thuộc tính khác.
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
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
