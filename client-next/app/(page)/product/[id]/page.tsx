"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ZoomIn,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";
import { useProductDetail } from "@/hooks/use-product-detail";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { data: product, isLoading, error } = useProductDetail(params.id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isLoading) {
    return (
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 text-primary animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">
              Đang tải sản phẩm...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-600 dark:text-red-400">
              Không tìm thấy sản phẩm
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      </main>
    );
  }

  const productImages =
    product.images.length > 0
      ? product.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => img.url)
      : [FALLBACK_IMAGE];
  const availableSizes = [
    ...new Set(product.variants.map((v) => v.attributes.size)),
  ].filter(Boolean);
  const currentSelectedSize =
    selectedSize || (availableSizes.length > 0 ? availableSizes[0] : "");
  const selectedVariant = product.variants.find(
    (v) => v.attributes.size === currentSelectedSize,
  );
  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product.basePrice;
  const stockAvailable = selectedVariant ? selectedVariant.stockAvailable : 0;

  useEffect(() => {
    if (!selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  return (
    <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="flex mb-8">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Trang chủ
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="text-slate-400 w-4 h-4 mx-1" />
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                {product.categories[0]?.name || "Sản phẩm"}
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="text-slate-400 w-4 h-4 mx-1" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {product.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 md:h-[600px] scrollbar-hide">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"}`}
              >
                <img
                  alt={`Ảnh thu nhỏ ${index + 1}`}
                  className="w-full h-full object-center object-cover"
                  src={image}
                />
              </button>
            ))}
          </div>
          <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[600px] group">
            <img
              alt="Ảnh sản phẩm chính"
              className="w-full h-full object-center object-cover"
              src={productImages[selectedImage]}
            />
            <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center text-yellow-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.reviews.averageRating) ? "fill-current" : "text-slate-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {product.reviews.averageRating.toFixed(1)} (
                {product.reviews.totalReviews} đánh giá)
              </span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(currentPrice)}
              </p>
              {stockAvailable > 0 && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  Còn {stockAvailable} sản phẩm
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>

          {availableSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Kích cỡ:{" "}
                  <span className="text-slate-500 font-normal">
                    {currentSelectedSize}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 rounded-lg font-medium transition-colors ${currentSelectedSize === size ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent font-bold shadow-lg shadow-slate-200 dark:shadow-none" : "border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-4">
              <div className="flex items-center h-14 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 w-32">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  className="flex-1 w-full text-center bg-transparent border-none text-slate-900 dark:text-white font-semibold focus:ring-0 p-0"
                  readOnly
                  type="text"
                  value={quantity}
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button className="flex-1 h-14 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Thêm vào giỏ hàng
              </button>
              <button className="h-14 w-14 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 bg-white dark:bg-slate-800 transition-colors group">
                <Heart className="w-5 h-5 group-hover:fill-current" />
              </button>
            </div>
            <button className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
              Mua ngay
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Miễn phí vận chuyển
                </p>
                <p className="text-xs text-slate-500">Đơn hàng trên 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Thanh toán an toàn
                </p>
                <p className="text-xs text-slate-500">Bảo mật 100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {[
              { id: "description", label: "Mô tả" },
              { id: "material", label: "Chất liệu & Bảo quản" },
              { id: "shipping", label: "Vận chuyển & Đổi trả" },
              {
                id: "reviews",
                label: `Đánh giá (${product.reviews.totalReviews})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? "border-primary text-primary font-bold" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8 text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          {activeTab === "description" && (
            <>
              <p className="mb-4 whitespace-pre-line">{product.description}</p>
            </>
          )}
          {activeTab === "material" && (
            <div>
              <p className="mb-4">
                <strong>Chất liệu:</strong> Thông tin chất liệu đang được cập
                nhật
              </p>
            </div>
          )}
          {activeTab === "shipping" && (
            <div>
              <p className="mb-4">
                <strong>Thời gian vận chuyển:</strong> 2-5 ngày làm việc
              </p>
              <p className="mb-4">
                <strong>Chính sách đổi trả:</strong> Đổi trả miễn phí trong vòng
                30 ngày nếu sản phẩm còn nguyên tem mác và chưa qua sử dụng.
              </p>
            </div>
          )}
          {activeTab === "reviews" && (
            <div>
              <p>
                {product.reviews.totalReviews > 0
                  ? `Có ${product.reviews.totalReviews} đánh giá`
                  : "Chưa có đánh giá nào"}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
