import { useState } from "react";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import type { ProductDetail, ProductVariant } from "@/types/api";
import { toast } from "sonner";

interface VariantsTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function VariantsTab({ product, onUpdate }: VariantsTabProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const getStockStatus = (variant: ProductVariant) => {
    console.log(showModal, selectedVariant, onUpdate);
    if (variant.stockAvailable === 0) {
      return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    }
    if (variant.stockAvailable < variant.minStock) {
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Product Variants ({product.variants.length})
        </h3>
        <button
          onClick={() => {
            setSelectedVariant(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Variant
        </button>
      </div>

      {product.variants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No variants yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first variant to start managing inventory
          </p>
          <button
            onClick={() => {
              setSelectedVariant(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Variant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Attributes
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Image
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => {
                const stockStatus = getStockStatus(variant);
                return (
                  <tr
                    key={variant.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {variant.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(variant.attributes).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {key}: {String(value)}
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {variant.price.toLocaleString()} đ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Available: {variant.stockAvailable}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Reserved: {variant.stockReserved}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Min: {variant.minStock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {variant.images.length > 0 ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={variant.images[0].url}
                            alt={variant.sku}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVariant(variant);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this variant?",
                              )
                            ) {
                              toast.success("Variant deleted");
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
