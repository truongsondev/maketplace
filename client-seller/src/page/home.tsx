import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { Filters } from "@/components/admin/filters";
import { ProductsTable } from "@/components/admin/products-table";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPanel() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Content Area */}
        <div className="flex-1 p-8">
          {/* Page Header with Create Button */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <Link
              to="/products/add"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Product
            </Link>
          </div>

          {/* Filters */}
          <Filters />

          {/* Products Table */}
          <ProductsTable />
        </div>
      </main>
    </div>
  );
}
