import {
  Sidebar,
  Header,
  ProductFilters,
  ProductsTable,
  BulkActions,
} from "@/components/admin";
import { Plus, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { productService } from "@/services/api";
import type { ProductListItem, ProductListFilters } from "@/types/api";
import { toast } from "sonner";
import type {
  AdminProductLeastBought,
  AdminProductTopFavorited,
  AdminProductTopSelling,
} from "@/types/product-analytics";

function formatCompactNumber(n: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductListFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [aggregations, setAggregations] = useState({
    statusCount: { active: 0, inactive: 0, deleted: 0 },
    stockStatus: { all: 0, low: 0, out: 0 },
  });

  const analyticsDays = 30;
  const analyticsLimit = 5;
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [topSelling, setTopSelling] = useState<AdminProductTopSelling | null>(
    null,
  );
  const [topFavorited, setTopFavorited] =
    useState<AdminProductTopFavorited | null>(null);
  const [leastBought, setLeastBought] =
    useState<AdminProductLeastBought | null>(null);
  const [hovered, setHovered] = useState<
    { title: string; name: string; valueLabel: string } | undefined
  >(undefined);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.data.items);
      setPagination(response.data.pagination);
      setAggregations(response.data.aggregations);
    } catch (error) {
      toast.error("Không tải được danh sách sản phẩm");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [sellingRes, favoritedRes, leastRes] = await Promise.all([
        productService.getTopSelling({
          days: analyticsDays,
          limit: analyticsLimit,
        }),
        productService.getTopFavorited({
          days: analyticsDays,
          limit: analyticsLimit,
        }),
        productService.getLeastBought({
          days: analyticsDays,
          limit: analyticsLimit,
        }),
      ]);
      setTopSelling(sellingRes.data);
      setTopFavorited(favoritedRes.data);
      setLeastBought(leastRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilterChange = (newFilters: Partial<ProductListFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedIds([]);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await productService.bulkDelete({ productIds: selectedIds });
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error("Xóa sản phẩm thất bại");
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await productService.exportProducts(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `danh-sách-sản-phẩm-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Xuất file thành công");
    } catch (error) {
      toast.error("Xuất file thất bại");
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sản phẩm</h1>
                <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Xuất CSV
                </button>
                <Link
                  to="/products/create"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Tạo sản phẩm
                </Link>
              </div>
            </div>

            <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Top sản phẩm bán chạy
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {analyticsDays} ngày gần nhất
                    </p>
                  </div>
                </div>
                {analyticsLoading ? (
                  <p className="mt-3 text-sm text-gray-600">Đang tải…</p>
                ) : !topSelling || topSelling.items.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">Chưa có dữ liệu.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {(() => {
                      const max = Math.max(
                        ...topSelling.items.map((i) => i.quantitySold),
                        1,
                      );
                      return topSelling.items.map((item) => {
                        const pct = (item.quantitySold / max) * 100;
                        return (
                          <div key={item.productId} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate font-semibold text-gray-700">
                                {item.name}
                              </span>
                              <span className="whitespace-nowrap text-gray-600">
                                {formatCompactNumber(item.quantitySold)}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${pct}%` }}
                                onMouseEnter={() =>
                                  setHovered({
                                    title: "Top bán chạy",
                                    name: item.name,
                                    valueLabel: `Đã bán: ${formatCompactNumber(item.quantitySold)} (Đơn: ${formatCompactNumber(item.ordersCount)})`,
                                  })
                                }
                                onMouseLeave={() => setHovered(undefined)}
                                title={`Đã bán: ${item.quantitySold} (Đơn: ${item.ordersCount})`}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Top sản phẩm yêu thích
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {analyticsDays} ngày gần nhất
                    </p>
                  </div>
                </div>
                {analyticsLoading ? (
                  <p className="mt-3 text-sm text-gray-600">Đang tải…</p>
                ) : !topFavorited || topFavorited.items.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">Chưa có dữ liệu.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {(() => {
                      const max = Math.max(
                        ...topFavorited.items.map((i) => i.favoritesCount),
                        1,
                      );
                      return topFavorited.items.map((item) => {
                        const pct = (item.favoritesCount / max) * 100;
                        return (
                          <div key={item.productId} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate font-semibold text-gray-700">
                                {item.name}
                              </span>
                              <span className="whitespace-nowrap text-gray-600">
                                {formatCompactNumber(item.favoritesCount)}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-pink-600"
                                style={{ width: `${pct}%` }}
                                onMouseEnter={() =>
                                  setHovered({
                                    title: "Top yêu thích",
                                    name: item.name,
                                    valueLabel: `Lượt thích: ${formatCompactNumber(item.favoritesCount)}`,
                                  })
                                }
                                onMouseLeave={() => setHovered(undefined)}
                                title={`Lượt thích: ${item.favoritesCount}`}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Top sản phẩm ít mua
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {analyticsDays} ngày gần nhất
                    </p>
                  </div>
                </div>
                {analyticsLoading ? (
                  <p className="mt-3 text-sm text-gray-600">Đang tải…</p>
                ) : !leastBought || leastBought.items.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">Chưa có dữ liệu.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {(() => {
                      const max = Math.max(
                        ...leastBought.items.map((i) => i.quantitySold),
                        1,
                      );
                      return leastBought.items.map((item) => {
                        const pct = (item.quantitySold / max) * 100;
                        return (
                          <div key={item.productId} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate font-semibold text-gray-700">
                                {item.name}
                              </span>
                              <span className="whitespace-nowrap text-gray-600">
                                {formatCompactNumber(item.quantitySold)}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-amber-600"
                                style={{
                                  width: `${max > 0 ? Math.max(pct, 3) : 0}%`,
                                }}
                                onMouseEnter={() =>
                                  setHovered({
                                    title: "Top ít mua",
                                    name: item.name,
                                    valueLabel: `Đã bán: ${formatCompactNumber(item.quantitySold)}`,
                                  })
                                }
                                onMouseLeave={() => setHovered(undefined)}
                                title={`Đã bán: ${item.quantitySold}`}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {hovered ? (
                <div className="pointer-events-none absolute right-0 top-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                  <p className="font-semibold text-gray-900">{hovered.title}</p>
                  <p className="mt-0.5 max-w-80 truncate">{hovered.name}</p>
                  <p className="mt-0.5">{hovered.valueLabel}</p>
                </div>
              ) : null}
            </div>

            <ProductFilters
              filters={filters}
              aggregations={aggregations}
              onFilterChange={handleFilterChange}
            />

            {selectedIds.length > 0 && (
              <BulkActions
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onClearSelection={() => setSelectedIds([])}
              />
            )}

            <ProductsTable
              products={products}
              loading={loading}
              selectedIds={selectedIds}
              pagination={pagination}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onPageChange={handlePageChange}
              onSortChange={(sortBy, sortOrder) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: sortBy as
                    | "name"
                    | "basePrice"
                    | "createdAt"
                    | "totalStock",
                  sortOrder,
                }))
              }
              onRefresh={fetchProducts}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
