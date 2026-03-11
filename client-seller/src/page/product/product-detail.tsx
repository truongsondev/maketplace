import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productService } from "@/services/api";
import type { ProductDetail } from "@/types/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  BasicInformationTab,
  VariantsTab,
  ImagesTab,
  InventoryTab,
} from "@/components/admin/tabs";

type TabType = "basic" | "variants" | "images" | "inventory";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await productService.getProduct(id);
      setProduct(response.data);
    } catch (error) {
      toast.error("Failed to load product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const tabs = [
    { id: "basic" as TabType, label: "Basic Information" },
    {
      id: "variants" as TabType,
      label: "Variants",
      badge: product?.stats.totalVariants,
    },
    {
      id: "images" as TabType,
      label: "Images",
      badge: product?.stats.totalImages,
    },
    { id: "inventory" as TabType, label: "Inventory" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product not found
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-9xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Products
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  <p className="text-gray-600 mt-1">Product ID: {product.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700"
                        : product.status === "inactive"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.status.charAt(0).toUpperCase() +
                      product.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "basic" && (
                  <BasicInformationTab
                    product={product}
                    onUpdate={fetchProduct}
                  />
                )}
                {activeTab === "variants" && (
                  <VariantsTab product={product} onUpdate={fetchProduct} />
                )}
                {activeTab === "images" && (
                  <ImagesTab product={product} onUpdate={fetchProduct} />
                )}
                {activeTab === "inventory" && (
                  <InventoryTab productId={product.id} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
