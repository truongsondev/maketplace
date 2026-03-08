import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { ProductForm } from "@/components/admin/product-form";
import { ProductSidebar } from "@/components/admin/product-sidebar";
import {
  useCreateProduct,
  useCloudinarySignature,
  useImageUpload,
} from "@/hooks/api";
import type { CreateProductCommand } from "@/types/api";
import { toast } from "sonner";

// UI Form Data Interface
interface ProductFormData {
  name: string;
  basePrice: number;
  description: string;
  categoryId: string;
  tagIds: string[];
  productImages: ProductImage[]; // Ảnh chính của sản phẩm
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images: ProductImage[];
}

interface ProductImage {
  id: string;
  file?: File;
  url?: string;
  altText?: string;
  sortOrder: number;
  uploading?: boolean;
}

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Query hooks
  const createProductMutation = useCreateProduct();
  const getSignatureMutation = useCloudinarySignature();
  const uploadImageMutation = useImageUpload();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    basePrice: 0,
    description: "",
    categoryId: "",
    tagIds: [],
    productImages: [], // Ảnh chính của product
    variants: [
      {
        id: "variant-1",
        sku: "",
        attributes: { color: "", size: "" },
        price: 0,
        stockAvailable: 0,
        minStock: 0,
        images: [],
      },
    ],
  });

  const handleFormChange = (
    field: keyof ProductFormData,
    value:
      | string
      | number
      | boolean
      | string[]
      | ProductVariant[]
      | ProductImage[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Cloud upload function using React Query
  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const signatureResponse = await getSignatureMutation.mutateAsync();
      const imageUrl = await uploadImageMutation.mutateAsync({
        file,
        signature: signatureResponse.data,
      });
      return imageUrl;
    } catch {
      throw new Error("Upload failed");
    }
  };

  const handleImageUpload = (file: File, variantId: string | "product") => {
    // Create preview URL for the image
    const previewUrl = URL.createObjectURL(file);

    if (variantId === "product") {
      // Add to product images (main image)
      const newImage: ProductImage = {
        id: `img-${Date.now()}`,
        file: file,
        url: previewUrl,
        altText: file.name,
        sortOrder: formData.productImages.length,
        uploading: false,
      };

      setFormData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, newImage],
      }));
    } else {
      // Add to variant images
      const variantIndex = formData.variants.findIndex(
        (v) => v.id === variantId,
      );
      if (variantIndex === -1) return;

      const newImage: ProductImage = {
        id: `img-${Date.now()}`,
        file: file,
        url: previewUrl,
        altText: file.name,
        sortOrder: formData.variants[variantIndex].images.length,
        uploading: false,
      };

      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, idx) =>
          idx === variantIndex
            ? { ...variant, images: [...variant.images, newImage] }
            : variant,
        ),
      }));
    }

    toast.success("Đã chọn ảnh");
  };

  // Remove image from variant or product
  const handleRemoveImage = (
    variantId: string | "product",
    imageId: string,
  ) => {
    if (variantId === "product") {
      setFormData((prev) => ({
        ...prev,
        productImages: prev.productImages.filter((img) => img.id !== imageId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                images: variant.images.filter((img) => img.id !== imageId),
              }
            : variant,
        ),
      }));
    }
  };

  // Handle variant changes
  const handleVariantChange = (
    variantId: string,
    field: string,
    value:
      | string
      | number
      | boolean
      | Record<string, string | number | boolean>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `variant-${Date.now()}`,
      sku: "",
      attributes: { color: "", size: "" },
      price: formData.basePrice,
      stockAvailable: 0,
      minStock: 0,
      images: [],
    };

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (variantId: string) => {
    if (formData.variants.length > 1) {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.filter((v) => v.id !== variantId),
      }));
    }
  };

  // Submit product using React Query
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate form data
      if (!formData.name.trim()) {
        toast.error("Tên sản phẩm là bắt buộc");
        return;
      }

      if (formData.basePrice <= 0) {
        toast.error("Giá gốc phải lớn hơn 0");
        return;
      }

      if (formData.variants.length === 0) {
        toast.error("Cần có ít nhất một phiên bản sản phẩm");
        return;
      }

      // Upload all images first
      toast.info("Đang tải ảnh lên...");

      // Upload product images (main images)
      const uploadedProductImages = await Promise.all(
        formData.productImages.map(async (img) => {
          if (img.file) {
            try {
              const url = await uploadToCloudinary(img.file);
              return {
                url,
                altText: img.altText,
                sortOrder: img.sortOrder,
                isPrimary: true,
              };
            } catch (error) {
              console.error("Error uploading product image:", error);
              throw new Error("Không thể tải ảnh sản phẩm lên");
            }
          }
          return {
            url: img.url!,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: true,
          };
        }),
      );

      // Upload variant images
      const variantsWithUploadedImages = await Promise.all(
        formData.variants.map(async (variant) => {
          const uploadedImages = await Promise.all(
            variant.images.map(async (img) => {
              if (img.file) {
                try {
                  const url = await uploadToCloudinary(img.file);
                  return {
                    url,
                    altText: img.altText,
                    sortOrder: img.sortOrder,
                  };
                } catch (error) {
                  console.error("Error uploading variant image:", error);
                  throw new Error("Không thể tải ảnh variant lên");
                }
              }
              return {
                url: img.url!,
                altText: img.altText,
                sortOrder: img.sortOrder,
              };
            }),
          );

          return {
            sku:
              variant.sku ||
              `${formData.name.replace(/\s+/g, "-").toUpperCase()}-${variant.id}`,
            attributes: variant.attributes,
            price: variant.price || formData.basePrice,
            stockAvailable: variant.stockAvailable,
            minStock: variant.minStock,
            images: uploadedImages.filter((img) => img.url),
          };
        }),
      );

      // Prepare product data
      const productData: CreateProductCommand = {
        name: formData.name,
        description: formData.description,
        basePrice: formData.basePrice,
        images: uploadedProductImages.filter((img) => img.url),
        variants: variantsWithUploadedImages,
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
        tagIds: formData.tagIds,
      };

      // Submit using React Query mutation
      toast.info("Đang tạo sản phẩm...");
      await createProductMutation.mutateAsync(productData);
      toast.success("Tạo sản phẩm thành công!");
      navigate("/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Có lỗi xảy ra khi tạo sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
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
              Quay lại
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-blue-600 hover:text-blue-700">
              Sản phẩm
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Thêm sản phẩm mới</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Thêm sản phẩm mới
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <ProductForm
                formData={formData}
                onFormChange={handleFormChange}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                onVariantChange={handleVariantChange}
                onAddVariant={addVariant}
                onRemoveVariant={removeVariant}
              />
            </div>

            {/* Sidebar */}
            <div>
              <ProductSidebar
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
