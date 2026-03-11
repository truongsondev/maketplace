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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.data.items);
      setPagination(response.data.pagination);
      setAggregations(response.data.aggregations);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

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
      toast.success(`Deleted ${selectedIds.length} products`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete products");
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await productService.exportProducts(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Export completed");
    } catch (error) {
      toast.error("Failed to export products");
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
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600 mt-1">
                  Manage your product catalog
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
                <Link
                  to="/products/create"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Product
                </Link>
              </div>
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
