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
  useProductTypeSchema,
} from "@/hooks/api";
import type { CreateProductCommand } from "@/types/api";
import { toast } from "sonner";

function buildVariantOptionKeyFromAttributes(
  attributes: unknown,
  sku?: string,
): string {
  const fallbackSku = typeof sku === "string" ? sku.trim() : "";

  if (
    !attributes ||
    typeof attributes !== "object" ||
    Array.isArray(attributes)
  ) {
    return fallbackSku ? `sku=${fallbackSku}` : "default";
  }

  const entries = Object.entries(attributes as Record<string, unknown>)
    .filter(([key, value]) => {
      if (!key || key.trim() === "") return false;
      if (value === null || value === undefined) return false;
      const str = String(value).trim();
      return str.length > 0;
    })
    .map(([key, value]) => [key.trim(), String(value).trim()] as const);

  if (entries.length === 0)
    return fallbackSku ? `sku=${fallbackSku}` : "default";
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([key, value]) => `${key}=${value}`).join("|");
}

function normalizeAttributesForApi(
  attributes: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const entries = Object.entries(attributes).filter(([key, value]) => {
    if (!key || key.trim() === "") return false;
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    return str.length > 0;
  });

  return Object.fromEntries(
    entries.map(([key, value]) => [key.trim(), value] as const),
  );
}

function htmlToPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

// UI Form Data Interface
interface ProductFormData {
  name: string;
  basePrice: number;
  simpleStockAvailable: number;
  detailedDescription: string;
  careInstruction: string;
  fitNote: string;
  categoryId: string;
  tagIds: string[];
  usageOccasions: string[];
  targetAgeGroup: string;
  sizeGuideImage: ProductImage | null;
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
  const [hasVariants, setHasVariants] = useState(true);

  // React Query hooks
  const createProductMutation = useCreateProduct();
  const getSignatureMutation = useCloudinarySignature();
  const uploadImageMutation = useImageUpload();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    basePrice: 0,
    simpleStockAvailable: 0,
    detailedDescription: "",
    careInstruction: "",
    fitNote: "",
    categoryId: "",
    tagIds: [],
    usageOccasions: [],
    targetAgeGroup: "",
    sizeGuideImage: null,
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

  const { data: productTypeSchemaResponse } = useProductTypeSchema(
    formData.categoryId,
  );

  const axisAttributes =
    productTypeSchemaResponse?.data?.variantAxisAttributes ?? [];

  const handleFormChange = (
    field: keyof ProductFormData,
    value:
      | string
      | number
      | boolean
      | string[]
      | ProductVariant[]
      | ProductImage[]
      | ProductImage
      | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Cloud upload function using React Query
  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const signatureResponse =
        await getSignatureMutation.mutateAsync("products");
      const imageUrl = await uploadImageMutation.mutateAsync({
        file,
        signature: signatureResponse.data,
      });
      return imageUrl;
    } catch {
      throw new Error("Tải ảnh thất bại");
    }
  };

  const handleImageUpload = (
    file: File,
    variantId: string | "product" | "size-guide",
  ) => {
    // Create preview URL for the image
    const previewUrl = URL.createObjectURL(file);

    if (variantId === "product") {
      // Product main image: only 1 image is allowed. Replace existing.
      const newImage: ProductImage = {
        id: `img-${Date.now()}`,
        file: file,
        url: previewUrl,
        altText: file.name,
        sortOrder: 0,
        uploading: false,
      };

      setFormData((prev) => ({
        ...prev,
        productImages: [newImage],
      }));
    } else if (variantId === "size-guide") {
      const sizeGuideImage: ProductImage = {
        id: `size-guide-${Date.now()}`,
        file,
        url: previewUrl,
        altText: `Bang huong dan chon size - ${formData.name || "san pham"}`,
        sortOrder: 0,
        uploading: false,
      };

      setFormData((prev) => ({
        ...prev,
        sizeGuideImage,
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
    variantId: string | "product" | "size-guide",
    imageId: string,
  ) => {
    if (variantId === "product") {
      setFormData((prev) => ({
        ...prev,
        productImages: prev.productImages.filter((img) => img.id !== imageId),
      }));
    } else if (variantId === "size-guide") {
      setFormData((prev) => ({
        ...prev,
        sizeGuideImage:
          prev.sizeGuideImage?.id === imageId ? null : prev.sizeGuideImage,
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

      if (!formData.categoryId) {
        toast.error("Vui lòng chọn danh mục sản phẩm");
        return;
      }

      if (hasVariants && formData.variants.length === 0) {
        toast.error("Cần có ít nhất một phiên bản sản phẩm");
        return;
      }

      if (!hasVariants && (formData.simpleStockAvailable ?? 0) < 0) {
        toast.error("Tồn kho sản phẩm phải >= 0");
        return;
      }

      if (formData.usageOccasions.length === 0) {
        toast.error("Vui lòng chọn ít nhất một mục đích sử dụng");
        return;
      }

      if (!formData.targetAgeGroup) {
        toast.error("Vui lòng chọn độ tuổi phù hợp");
        return;
      }

      if (htmlToPlainText(formData.detailedDescription || "").length < 120) {
        toast.error("Mô tả chi tiết nên có ít nhất 120 ký tự để tối ưu SEO");
        return;
      }

      // Validate variants to avoid unique constraint violations on optionKey.
      if (hasVariants) {
        const optionKeyToVariantId = new Map<string, string>();
        for (const variant of formData.variants) {
          if (
            (variant.stockAvailable ?? 0) < 0 ||
            (variant.minStock ?? 0) < 0
          ) {
            toast.error("Tồn kho và tồn kho tối thiểu phải >= 0");
            return;
          }

          const effectiveSku =
            variant.sku?.trim() ||
            `${formData.name.replace(/\s+/g, "-").toUpperCase()}-${variant.id}`;

          const normalizedAttributes = normalizeAttributesForApi(
            variant.attributes,
          );

          const optionKey = buildVariantOptionKeyFromAttributes(
            normalizedAttributes,
            effectiveSku,
          );
          const prev = optionKeyToVariantId.get(optionKey);
          if (prev) {
            toast.error(
              "Các phiên bản đang bị trùng tổ hợp thuộc tính (color/size/thuộc tính). Vui lòng chỉnh để khác nhau.",
            );
            return;
          }
          optionKeyToVariantId.set(optionKey, variant.id);
        }
      }

      // Upload all images first
      toast.info("Đang tải ảnh lên...");

      // Upload product images (main images)
      const uploadedProductImages = await Promise.all(
        formData.productImages.map(async (img, idx) => {
          if (img.file) {
            try {
              const url = await uploadToCloudinary(img.file);
              return {
                url,
                altText: img.altText,
                sortOrder: img.sortOrder,
                isPrimary: idx === 0,
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
            isPrimary: idx === 0,
          };
        }),
      );

      // Upload variant images
      const variantsWithUploadedImages = hasVariants
        ? await Promise.all(
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
                      throw new Error("Không thể tải ảnh phiên bản lên");
                    }
                  }
                  return {
                    url: img.url!,
                    altText: img.altText,
                    sortOrder: img.sortOrder,
                  };
                }),
              );

              const normalizedAttributes = normalizeAttributesForApi(
                variant.attributes,
              );

              return {
                sku:
                  variant.sku?.trim() ||
                  `${formData.name.replace(/\s+/g, "-").toUpperCase()}-${variant.id}`,
                attributes: normalizedAttributes,
                price: variant.price || formData.basePrice,
                stockAvailable: variant.stockAvailable,
                minStock: variant.minStock,
                images: uploadedImages.filter((img) => img.url),
              };
            }),
          )
        : [
            {
              sku:
                `${formData.name.replace(/\s+/g, "-").toUpperCase()}-DEFAULT`.slice(
                  0,
                  100,
                ) || `PRODUCT-${Date.now()}-DEFAULT`,
              attributes: {},
              price: formData.basePrice,
              stockAvailable: formData.simpleStockAvailable,
              minStock: 0,
              images: [],
            },
          ];

      let sizeGuideImageUrl: string | null = null;
      if (formData.sizeGuideImage?.file) {
        sizeGuideImageUrl = await uploadToCloudinary(
          formData.sizeGuideImage.file,
        );
      } else if (formData.sizeGuideImage?.url) {
        sizeGuideImageUrl = formData.sizeGuideImage.url;
      }

      const productAttributes: NonNullable<
        CreateProductCommand["productAttributes"]
      > = [
        {
          code: "usage_occasions",
          value: formData.usageOccasions,
        },
        {
          code: "target_age_group",
          value: formData.targetAgeGroup,
        },
        {
          code: "product_story",
          value: formData.detailedDescription.trim(),
        },
        {
          code: "care_instruction",
          value: formData.careInstruction.trim(),
        },
        {
          code: "fit_note",
          value: formData.fitNote.trim(),
        },
      ];

      if (sizeGuideImageUrl) {
        productAttributes.push({
          code: "size_guide_image_url",
          value: sizeGuideImageUrl,
        });
      }

      // Prepare product data
      const productData: CreateProductCommand = {
        name: formData.name,
        basePrice: formData.basePrice,
        images: uploadedProductImages.filter((img) => img.url),
        variants: variantsWithUploadedImages,
        categoryIds: [formData.categoryId],
        tagIds: formData.tagIds,
        productAttributes: productAttributes.filter((attr) => {
          if (Array.isArray(attr.value)) return attr.value.length > 0;
          if (attr.value === null || attr.value === undefined) return false;
          return String(attr.value).trim().length > 0;
        }),
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
                hasVariants={hasVariants}
                onHasVariantsChange={setHasVariants}
                onFormChange={handleFormChange}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                onVariantChange={handleVariantChange}
                onAddVariant={addVariant}
                onRemoveVariant={removeVariant}
                axisAttributes={axisAttributes}
              />
            </div>

            {/* Sidebar */}
            <div>
              <ProductSidebar
                formData={formData}
                hasVariants={hasVariants}
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
