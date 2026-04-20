import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductListItem } from "@/types/api";
import { productService } from "@/services/api";
import { toast } from "sonner";

interface ProductsTableProps {
  products: ProductListItem[];
  loading: boolean;
  selectedIds: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sortBy?: string;
  sortOrder?: string;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onRefresh: () => void;
}

export function ProductsTable({
  products,
  loading,
  selectedIds,
  pagination,
  sortBy,
  sortOrder,
  onSelectAll,
  onSelectOne,
  onPageChange,
  onSortChange,
  onRefresh,
}: ProductsTableProps) {
  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, newOrder);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    try {
      await productService.deleteProduct(id);
      toast.success("Đã xóa sản phẩm");
      onRefresh();
    } catch (error) {
      toast.error("Xóa sản phẩm thất bại");
      console.error(error);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Bạn có chắc muốn khôi phục sản phẩm này không?")) return;
    try {
      await productService.restoreProduct(id);
      toast.success("Đã khôi phục sản phẩm");
      onRefresh();
    } catch (error) {
      toast.error("Khôi phục sản phẩm thất bại");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-yellow-100 text-yellow-700",
      deleted: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStockBadge = (stock: number, lowStockCount: number) => {
    if (stock === 0) return "bg-red-100 text-red-700";
    if (lowStockCount > 0) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          Hiển thị {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} /{" "}
          {pagination.total} sản phẩm
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 w-12">
                <Checkbox
                  checked={
                    selectedIds.length === products.length &&
                    products.length > 0
                  }
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("basePrice")}
              >
                <div className="flex items-center gap-2">
                  Giá
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Biến thể
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("totalStock")}
              >
                <div className="flex items-center gap-2">
                  Tồn kho
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Trạng thái
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Ngày tạo
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Không tìm thấy sản phẩm. Hãy tạo sản phẩm đầu tiên để bắt đầu.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) =>
                        onSelectOne(product.id, checked as boolean)
                      }
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex items-center gap-4 hover:text-blue-600"
                    >
                      <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {product.primaryImage ? (
                          <img
                            src={product.primaryImage.url}
                            alt={product.primaryImage.altText || product.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.variantsSummary.count} biến thể
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {product.variantsSummary.priceRange.max ===
                      product.variantsSummary.priceRange.min
                        ? `${product.variantsSummary.priceRange.min.toLocaleString()} đ`
                        : `${product.variantsSummary.priceRange.min.toLocaleString()} - ${product.variantsSummary.priceRange.max.toLocaleString()} đ`}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {product.variantsSummary.count}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStockBadge(
                          product.variantsSummary.totalStock,
                          product.variantsSummary.lowStockCount,
                        )}`}
                      >
                        {product.variantsSummary.totalStock}
                      </span>
                      {product.variantsSummary.lowStockCount > 0 && (
                        <span className="text-xs text-yellow-600">
                          {product.variantsSummary.lowStockCount} sắp hết
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {cat.name}
                        </span>
                      ))}
                      {product.categories.length > 2 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{product.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                        product.status,
                      )}`}
                    >
                      {product.status === "active"
                        ? "Đang hoạt động"
                        : product.status === "inactive"
                          ? "Tạm ngưng"
                          : "Đã xóa"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {product.status === "deleted" ? (
                        <button
                          onClick={() => handleRestore(product.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Khôi phục"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Số dòng mỗi trang:</span>
          <select
            value={pagination.limit}
            onChange={() => {
              // const newLimit = Number(e.target.value);

              onPageChange(1); // Reset to first page when limit changes
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
