import { useState, useEffect, useMemo } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Package,
} from "lucide-react";
import { productService } from "@/services/api";
import type { InventoryLog, ProductDetail, ProductVariant } from "@/types/api";
import { toast } from "sonner";

interface InventoryTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function InventoryTab({ product, onUpdate }: InventoryTabProps) {
  const productId = product.id;
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savingSimpleInventory, setSavingSimpleInventory] = useState(false);

  const isInternalDefaultVariant = (variant: ProductVariant) => {
    const nonEmptyAttributes = Object.entries(variant.attributes ?? {}).filter(
      ([key, value]) => {
        if (!key || key.trim() === "") return false;
        if (value === null || value === undefined) return false;
        return String(value).trim().length > 0;
      },
    ).length;

    return (
      nonEmptyAttributes === 0 &&
      variant.sku.trim().toUpperCase().endsWith("-DEFAULT")
    );
  };

  const internalSimpleVariant = useMemo(() => {
    if (product.variants.length !== 1) return null;
    const onlyVariant = product.variants[0];
    return isInternalDefaultVariant(onlyVariant) ? onlyVariant : null;
  }, [product.variants]);

  const [simpleStockAvailable, setSimpleStockAvailable] = useState<number>(
    internalSimpleVariant?.stockAvailable ?? 0,
  );
  const [simpleMinStock, setSimpleMinStock] = useState<number>(
    internalSimpleVariant?.minStock ?? 0,
  );

  useEffect(() => {
    setSimpleStockAvailable(internalSimpleVariant?.stockAvailable ?? 0);
    setSimpleMinStock(internalSimpleVariant?.minStock ?? 0);
  }, [
    internalSimpleVariant?.id,
    internalSimpleVariant?.stockAvailable,
    internalSimpleVariant?.minStock,
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await productService.getInventoryLogs({
        productId,
        page,
        limit: 20,
      });
      setLogs(response.data.items);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error("Không tải được nhật ký tồn kho");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, productId]);

  const handleSaveSimpleInventory = async () => {
    if (!internalSimpleVariant || savingSimpleInventory) return;

    if (Number.isNaN(simpleStockAvailable) || simpleStockAvailable < 0) {
      toast.error("Tồn kho sẵn có phải là số không âm");
      return;
    }

    if (Number.isNaN(simpleMinStock) || simpleMinStock < 0) {
      toast.error("Tồn kho tối thiểu phải là số không âm");
      return;
    }

    try {
      setSavingSimpleInventory(true);
      await productService.updateProduct(productId, {
        variants: [
          {
            id: internalSimpleVariant.id,
            sku: internalSimpleVariant.sku,
            attributes: internalSimpleVariant.attributes,
            price: internalSimpleVariant.price,
            stockAvailable: simpleStockAvailable,
            minStock: simpleMinStock,
          },
        ],
      });
      toast.success("Đã cập nhật tồn kho sản phẩm không biến thể");
      onUpdate();
      fetchLogs();
    } catch (error) {
      toast.error("Cập nhật tồn kho thất bại");
      console.error(error);
    } finally {
      setSavingSimpleInventory(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "IMPORT":
        return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case "EXPORT":
        return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case "RETURN":
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case "ADJUSTMENT":
        return <Package className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "IMPORT":
        return "bg-green-100 text-green-700";
      case "EXPORT":
        return "bg-red-100 text-red-700";
      case "RETURN":
        return "bg-blue-100 text-blue-700";
      case "ADJUSTMENT":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải nhật ký tồn kho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {internalSimpleVariant && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Chỉnh tồn kho sản phẩm không biến thể
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tồn kho sẵn có
              </label>
              <input
                type="number"
                min={0}
                value={simpleStockAvailable}
                onChange={(e) =>
                  setSimpleStockAvailable(Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tồn kho tối thiểu
              </label>
              <input
                type="number"
                min={0}
                value={simpleMinStock}
                onChange={(e) => setSimpleMinStock(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSimpleInventory}
              disabled={savingSimpleInventory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingSimpleInventory ? "Đang lưu..." : "Lưu tồn kho"}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lịch sử tồn kho</h3>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có nhật ký tồn kho
          </h3>
          <p className="text-gray-600">Thay đổi tồn kho sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Ngày & giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Hành động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Biến động tồn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Tham chiếu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          log.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {log.quantity > 0 ? "+" : ""}
                        {log.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {log.quantityBefore} → {log.quantityAfter}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.referenceId ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{log.referenceId}</div>
                          {log.referenceType && (
                            <div className="text-xs text-gray-600">
                              {log.referenceType}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {log.note || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
