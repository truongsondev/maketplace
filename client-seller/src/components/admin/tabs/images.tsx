import { useState } from "react";
import { Upload, Trash2, Star, Image as ImageIcon } from "lucide-react";
import type { ProductDetail, ProductImage } from "@/types/api";
import { toast } from "sonner";

interface ImagesTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function ImagesTab({ product, onUpdate }: ImagesTabProps) {
  const [images, setImages] = useState<ProductImage[]>(product.images);

  const handleSetPrimary = (imageId: string) => {
    console.log(imageId);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    );
    toast.success("Đã cập nhật ảnh chính");
    onUpdate();
  };

  const handleDelete = (imageId: string) => {
    console.log(imageId);
    if (confirm("Bạn có chắc muốn xóa ảnh này không?")) {
      toast.success("Đã xóa ảnh");
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Ảnh sản phẩm ({images.length})
        </h3>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          Tải ảnh lên
          <input type="file" multiple accept="image/*" className="hidden" />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có ảnh
          </h3>
          <p className="text-gray-600 mb-4">
            Tải ảnh sản phẩm lên để hiển thị sản phẩm của bạn
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Tải ảnh lên
            <input type="file" multiple accept="image/*" className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={image.url}
                alt={image.altText || "Ảnh sản phẩm"}
                className="w-full h-full object-cover"
              />
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Chính
                </div>
              )}
              {image.variantId && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Biến thể
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Đặt làm ảnh chính"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
