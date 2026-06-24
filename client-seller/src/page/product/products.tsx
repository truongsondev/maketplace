import {
  Sidebar,
  Header,
  ProductFilters,
  ProductsTable,
  BulkActions,
  AdminPageShell,
  AlertItem,
  MetricBar,
  OpsCard,
  SectionHeading,
  SituationAssessmentPanel,
} from "@/components/admin";
import {
  Brain,
  Plus,
  Download,
  PackageCheck,
  PackageX,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
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
  const [showAssessment, setShowAssessment] = useState(false);

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
    const query = new URLSearchParams(location.search);
    const nextSearch = query.get("search")?.trim() || undefined;
    const stockStatus = query.get("stockStatus");
    const nextStockStatus =
      stockStatus === "all" || stockStatus === "low" || stockStatus === "out"
        ? stockStatus
        : undefined;

    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: nextSearch,
      stockStatus: nextStockStatus,
    }));
  }, [location.search]);

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

  const activeProducts = aggregations.statusCount.active;
  const lowStockCount = aggregations.stockStatus.low;
  const outStockCount = aggregations.stockStatus.out;
  const totalStockScope = Math.max(aggregations.stockStatus.all, 1);
  const bestSeller = topSelling?.items[0];
  const mostFavorited = topFavorited?.items[0];
  const slowMover = leastBought?.items[0];
  const productAssessment = {
    summary:
      outStockCount > 0
        ? "Tình hình sản phẩm đang nghiêng về rủi ro mất doanh thu vì có nhóm hết hàng cần xử lý ngay."
        : lowStockCount > 0
          ? "Tồn kho đang chịu áp lực bổ sung, nhưng vẫn còn cửa chủ động trước khi mất doanh thu."
          : "Sức khỏe sản phẩm đang ổn, có thể tập trung nhiều hơn vào tối ưu bán chạy và chuyển đổi.",
    items: [
      {
        title: "Tồn kho",
        detail: `Hiện có ${lowStockCount} SKU sắp hết hàng và ${outStockCount} SKU hết hàng trên tổng ${aggregations.stockStatus.all} SKU trong vùng theo dõi.`,
        tone:
          outStockCount > 0
            ? ("danger" as const)
            : lowStockCount > 0
              ? ("warning" as const)
              : ("good" as const),
      },
      {
        title: "Nhu cầu thị trường",
        detail: bestSeller
          ? `${bestSeller.name} đang dẫn đầu với ${formatCompactNumber(bestSeller.quantitySold)} sản phẩm bán ra. ${mostFavorited ? `${mostFavorited.name} lại đang nổi bật về quan tâm.` : "Dữ liệu yêu thích chưa quá nổi bật."}`
          : "Chưa có đủ dữ liệu bán chạy để kết luận về nhu cầu.",
        tone: "info" as const,
      },
      {
        title: "Điểm cần xem tiếp",
        detail: slowMover
          ? `${slowMover.name} là ứng viên tồn chậm. Nên kiểm tra ảnh, giá, biến thể và quyết định đẩy hàng hay giảm độ ưu tiên.`
          : "Chưa thấy sản phẩm tồn chậm nổi bật trong tập dữ liệu hiện tại.",
        tone: "warning" as const,
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <AdminPageShell
            eyebrow="Thông tin tồn kho"
            title="Tổng quan sản phẩm"
            description="Theo dõi sức khỏe tồn kho, tốc độ bán, tín hiệu yêu thích và nhóm cần xử lý trước khi vào bảng sản phẩm."
            action={
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssessment((prev) => !prev)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Brain className="size-4" />
                  {showAssessment
                    ? "Ẩn đánh giá tình hình"
                    : "Đánh giá tình hình"}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Download className="w-5 h-5" />
                  Xuất CSV
                </button>
                <Link
                  to="/products/create"
                  className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2 text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="w-5 h-5" />
                  Tạo sản phẩm
                </Link>
              </div>
            }
          >
            {showAssessment ? (
              <SituationAssessmentPanel
                title="Đánh giá tình hình tab Sản phẩm"
                summary={productAssessment.summary}
                items={productAssessment.items}
              />
            ) : null}
            <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <OpsCard className="border-amber-200 bg-linear-to-br from-white to-amber-50">
                <SectionHeading title="Bảng tồn kho" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ stockStatus: "low" })}
                    className="rounded-2xl border border-amber-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                      Sắp hết hàng
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {lowStockCount}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Cần bổ sung</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ stockStatus: "out" })}
                    className="rounded-2xl border border-rose-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                      Hết hàng
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {outStockCount}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Mất doanh thu</p>
                  </button>
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                      Đang bán
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {activeProducts}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Đang bán</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <MetricBar
                    label="Mức ảnh hưởng sắp hết hàng"
                    value={lowStockCount}
                    max={totalStockScope}
                    tone="warning"
                    detail={`${lowStockCount}/${aggregations.stockStatus.all}`}
                  />
                  <MetricBar
                    label="Mức ảnh hưởng hết hàng"
                    value={outStockCount}
                    max={totalStockScope}
                    tone="danger"
                    detail={`${outStockCount}/${aggregations.stockStatus.all}`}
                  />
                </div>
              </OpsCard>

              <OpsCard>
                <SectionHeading title="Thông tin sản phẩm" />
                <div className="grid gap-3 lg:grid-cols-3">
                  <AlertItem
                    tone="good"
                    icon={TrendingUp}
                    title={bestSeller?.name ?? "Chưa có top bán chạy"}
                    description={
                      bestSeller
                        ? `Bán nhanh: ${formatCompactNumber(bestSeller.quantitySold)} sản phẩm / ${formatCompactNumber(bestSeller.ordersCount)} đơn.`
                        : "Chưa có đủ dữ liệu bán hàng trong kỳ."
                    }
                    action="Ưu tiên kiểm tra tồn"
                  />
                  <AlertItem
                    tone="info"
                    icon={PackageCheck}
                    title={mostFavorited?.name ?? "Chưa có top yêu thích"}
                    description={
                      mostFavorited
                        ? `${formatCompactNumber(mostFavorited.favoritesCount)} lượt thích. Nếu bán thấp, có thể đang nghẽn giá/ảnh/size.`
                        : "Chưa có dữ liệu favorite."
                    }
                    action="Xem độ lệch chuyển đổi"
                  />
                  <AlertItem
                    tone="warning"
                    icon={PackageX}
                    title={slowMover?.name ?? "Chưa có slow mover"}
                    description={
                      slowMover
                        ? `Ứng viên tồn chậm: chỉ ${formatCompactNumber(slowMover.quantitySold)} sản phẩm bán ra.`
                        : "Chưa có đủ dữ liệu sản phẩm ít mua."
                    }
                    action="Xem danh sách tồn chậm"
                  />
                </div>
              </OpsCard>
            </section>

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
                              <span
                                className="truncate font-semibold text-gray-700"
                                title={item.name}
                              >
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
                              <span
                                className="truncate font-semibold text-gray-700"
                                title={item.name}
                              >
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
                              <span
                                className="truncate font-semibold text-gray-700"
                                title={item.name}
                              >
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
              key={filters.search ?? "all-products"}
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
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
