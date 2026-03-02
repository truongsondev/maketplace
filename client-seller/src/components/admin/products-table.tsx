"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";

export function ProductsTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4">
                <Checkbox />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Product Name (SKU)
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Base Price (VND)
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Variants Count
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Total Stock
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((product) => (
              <tr
                key={product.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <Checkbox />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600">({product.sku})</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {product.basePrice.toLocaleString("vi-VN")} đ
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{product.variants}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{product.totalStock}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        product.stockLevel === "In Stock"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.stockLevel}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        product.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
            1
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 cursor-not-allowed rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page 1 of 1</span>
          <button className="p-2 text-gray-400 cursor-not-allowed rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
