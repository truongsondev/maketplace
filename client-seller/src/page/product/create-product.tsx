import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { ProductForm } from "@/components/admin/product-form";
import { ProductSidebar } from "@/components/admin/product-sidebar";

interface ProductFormData {
  name: string;
  basePrice: number;
  skuPrefix: string;
  description: string;
  category: string;
  tags: string[];
  isVisible: boolean;
}

export default function AddProductPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    basePrice: 0,
    skuPrefix: "",
    description: "",
    category: "Electronics",
    tags: [],
    isVisible: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFormChange = (
    field: keyof ProductFormData,
    value: string | number | boolean | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link
              to="/products"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-blue-600 hover:text-blue-700">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Add New Product</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Add New Product
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <ProductForm
                formData={formData}
                onFormChange={handleFormChange}
                onImageUpload={handleImageUpload}
                imagePreview={imagePreview}
              />
            </div>

            {/* Sidebar */}
            <div>
              <ProductSidebar
                formData={formData}
                onFormChange={handleFormChange}
                imagePreview={imagePreview}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
