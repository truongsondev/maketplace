import { Star, Image as ImageIcon } from "lucide-react";
import type { ProductDetail } from "@/types/api";

interface ImagesTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function ImagesTab({ product }: ImagesTabProps) {
  const images = product.images;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Ảnh sản phẩm ({images.length})
        </h3>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có ảnh
          </h3>
          <p className="text-gray-600 mb-4">
            Sản phẩm này chưa có ảnh hiển thị.
          </p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
