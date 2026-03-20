"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ZoomIn,
  ChevronRight,
  ChevronLeft,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ProductDetail } from "@/types/product";
import { useAddToCart } from "@/hooks/use-add-to-cart";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface ProductDetailContentProps {
  product: ProductDetail;
}

interface VariantOptionState {
  value: string;
  disabled: boolean;
  outOfStock: boolean;
}

function parseSizeValues(rawSize?: string): string[] {
  if (!rawSize) return [];

  return rawSize
    .split(/[,/|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const availableSizes = useMemo(
    () => [
      ...new Set(
        product.variants.flatMap((v) => parseSizeValues(v.attributes.size)),
      ),
    ],
    [product.variants],
  );

  const availableColors = useMemo(
    () =>
      [...new Set(product.variants.map((v) => v.attributes.color))].filter(
        Boolean,
      ),
    [product.variants],
  );

  const currentSelectedColor =
    selectedColor || (availableColors.length > 0 ? availableColors[0] : "");

  const availableSizesForCurrentColor = useMemo(
    () => [
      ...new Set(
        product.variants
          .filter((v) => v.attributes.color === currentSelectedColor)
          .flatMap((v) => parseSizeValues(v.attributes.size)),
      ),
    ],
    [product.variants, currentSelectedColor],
  );

  const currentSelectedSize =
    selectedSize ||
    (availableSizesForCurrentColor.length > 0
      ? availableSizesForCurrentColor[0]
      : "");

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (v) =>
          parseSizeValues(v.attributes.size).includes(currentSelectedSize) &&
          v.attributes.color === currentSelectedColor,
      ) ||
      product.variants.find(
        (v) => v.attributes.color === currentSelectedColor,
      ) ||
      product.variants.find((v) =>
        parseSizeValues(v.attributes.size).includes(currentSelectedSize),
      ) ||
      product.variants[0],
    [product.variants, currentSelectedSize, currentSelectedColor],
  );

  const productImages = useMemo(() => {
    // If a variant is selected and has images, show variant images first
    if (selectedVariant && selectedVariant.images.length > 0) {
      const variantImages = selectedVariant.images
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => img.url);

      // Also include main product images
      const mainImages = product.images
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => img.url);

      // Combine variant images first, then main images (avoiding duplicates)
      const uniqueImages = [...variantImages];
      mainImages.forEach((img) => {
        if (!uniqueImages.includes(img)) {
          uniqueImages.push(img);
        }
      });

      return uniqueImages.length > 0 ? uniqueImages : [FALLBACK_IMAGE];
    }

    // Otherwise show main product images
    return product.images.length > 0
      ? product.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => img.url)
      : [FALLBACK_IMAGE];
  }, [product.images, selectedVariant]);

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product.basePrice;
  const stockAvailable = selectedVariant ? selectedVariant.stockAvailable : 0;
  const canPurchase = stockAvailable > 0;
  const isLowStock = stockAvailable > 0 && stockAvailable <= 5;
  const requiresColorSelection = availableColors.length > 1;
  const requiresSizeSelection = availableSizesForCurrentColor.length > 1;
  const isColorSelected = !requiresColorSelection || Boolean(selectedColor);
  const isSizeSelected = !requiresSizeSelection || Boolean(selectedSize);

  // Ensure selected image is within bounds
  const safeSelectedImage = Math.min(selectedImage, productImages.length - 1);

  const handleQuantityChange = (delta: number) => {
    const maxQuantity = stockAvailable > 0 ? Math.min(stockAvailable, 10) : 1;
    setQuantity((prev) => Math.min(maxQuantity, Math.max(1, prev + delta)));
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);

    const exactVariant = product.variants.find(
      (v) =>
        v.attributes.color === color &&
        parseSizeValues(v.attributes.size).includes(currentSelectedSize),
    );

    if (!exactVariant || exactVariant.stockAvailable <= 0) {
      const colorVariants = product.variants.filter(
        (v) => v.attributes.color === color,
      );
      const inStockColorVariants = colorVariants.filter(
        (v) => v.stockAvailable > 0,
      );
      const targetVariants =
        inStockColorVariants.length > 0 ? inStockColorVariants : colorVariants;
      const nextSize = parseSizeValues(targetVariants[0]?.attributes.size)[0];

      if (nextSize) {
        setSelectedSize(nextSize);
      }
    }

    setSelectedImage(0);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);

    const exactVariant = product.variants.find(
      (v) =>
        parseSizeValues(v.attributes.size).includes(size) &&
        v.attributes.color === currentSelectedColor,
    );

    if (!exactVariant || exactVariant.stockAvailable <= 0) {
      const fallbackBySize =
        product.variants.find(
          (v) =>
            parseSizeValues(v.attributes.size).includes(size) &&
            v.stockAvailable > 0,
        ) ||
        product.variants.find((v) =>
          parseSizeValues(v.attributes.size).includes(size),
        );

      if (fallbackBySize?.attributes.color) {
        setSelectedColor(fallbackBySize.attributes.color);
      }
    }

    setSelectedImage(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderTabContent = (tabId: string) => {
    if (tabId === "description") {
      return <p className="mb-4 whitespace-pre-line">{product.description}</p>;
    }

    if (tabId === "material") {
      return (
        <p className="mb-4">
          <strong>Chất liệu:</strong> Thông tin chất liệu đang được cập nhật
        </p>
      );
    }

    if (tabId === "shipping") {
      return (
        <>
          <p className="mb-4">
            <strong>Thời gian vận chuyển:</strong> 2-5 ngày làm việc
          </p>
          <p className="mb-4">
            <strong>Chính sách đổi trả:</strong> Đổi trả miễn phí trong vòng 30
            ngày nếu sản phẩm còn nguyên tem mác và chưa qua sử dụng.
          </p>
        </>
      );
    }

    const ratingItems = [5, 4, 3, 2, 1].map((star) => {
      const count = Number(
        product.reviews.ratingDistribution[String(star)] ?? 0,
      );
      const percent =
        product.reviews.totalReviews > 0
          ? Math.round((count / product.reviews.totalReviews) * 100)
          : 0;

      return { star, count, percent };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {product.reviews.averageRating.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center text-yellow-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.reviews.averageRating) ? "fill-current" : "text-slate-300"}`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {product.reviews.totalReviews} đánh giá đã xác thực
            </p>
          </div>
        </div>

        {product.reviews.totalReviews > 0 ? (
          <div className="space-y-2">
            {ratingItems.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-slate-600 dark:text-slate-300">
                  {item.star}★
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="w-12 text-right text-slate-500">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có đánh giá nào</p>
        )}
      </div>
    );
  };

  const detailTabs = [
    { id: "description", label: "Mô tả" },
    { id: "material", label: "Chất liệu & Bảo quản" },
    { id: "shipping", label: "Vận chuyển & Đổi trả" },
    {
      id: "reviews",
      label: `Đánh giá (${product.reviews.totalReviews})`,
    },
  ];

  const colorOptions: VariantOptionState[] = useMemo(() => {
    return availableColors.map((color) => {
      const variantsByColor = product.variants.filter(
        (v) => v.attributes.color === color,
      );
      const outOfStock =
        variantsByColor.length > 0 &&
        variantsByColor.every((v) => v.stockAvailable <= 0);

      return {
        value: color,
        disabled: outOfStock,
        outOfStock,
      };
    });
  }, [availableColors, product.variants]);

  const sizeOptions: VariantOptionState[] = useMemo(() => {
    return availableSizesForCurrentColor.map((size) => {
      const variantsBySize = product.variants.filter(
        (v) =>
          v.attributes.color === currentSelectedColor &&
          parseSizeValues(v.attributes.size).includes(size),
      );
      const outOfStock =
        variantsBySize.length > 0 &&
        variantsBySize.every((v) => v.stockAvailable <= 0);

      return {
        value: size,
        disabled: outOfStock,
        outOfStock,
      };
    });
  }, [availableSizesForCurrentColor, product.variants, currentSelectedColor]);

  const fallbackVariant = product.variants[0];
  const variantSku = (selectedVariant || fallbackVariant)?.sku;
  const maxAllowedQuantity = canPurchase ? Math.min(stockAvailable, 10) : 1;
  const safeQuantity = canPurchase ? Math.min(quantity, maxAllowedQuantity) : 1;
  const addToCartDisabled =
    isAddingToCart ||
    !canPurchase ||
    !isColorSelected ||
    !isSizeSelected ||
    !selectedVariant?.id;

  const handleAddToCart = () => {
    if (!isColorSelected) {
      toast.warning("Vui lòng chọn màu sắc");
      return;
    }

    if (!isSizeSelected) {
      toast.warning("Vui lòng chọn kích cỡ");
      return;
    }

    if (!selectedVariant?.id) {
      toast.error("Không tìm thấy biến thể phù hợp");
      return;
    }

    if (!canPurchase) {
      toast.warning("Sản phẩm đang tạm hết hàng");
      return;
    }

    if (safeQuantity > 10) {
      toast.warning("Mỗi biến thể chỉ được thêm tối đa 10 sản phẩm");
      return;
    }

    addToCart({
      variantId: selectedVariant.id,
      quantity: safeQuantity,
    });
  };

  const handlePreviousImage = () => {
    setSelectedImage((prev) =>
      prev <= 0 ? Math.max(0, productImages.length - 1) : prev - 1,
    );
  };

  const handleNextImage = () => {
    setSelectedImage((prev) =>
      prev >= productImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleImageTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (Math.abs(diff) < minSwipeDistance) return;
    if (diff > 0) {
      handleNextImage();
      return;
    }

    handlePreviousImage();
  };

  return (
    <main className="flex-grow w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10">
      <nav aria-label="Breadcrumb" className="flex mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10">
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
          <div
            className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 md:h-[620px] pb-1 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${safeSelectedImage === index ? "border-primary shadow-md shadow-primary/20 scale-[1.02]" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"}`}
              >
                <Image
                  alt={`Ảnh thu nhỏ ${index + 1}`}
                  className="object-center object-cover"
                  src={image}
                  fill
                  sizes="(max-width: 768px) 80px, 96px"
                />
              </button>
            ))}
          </div>
          <div
            className="flex-1 relative bg-gradient-to-b from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-900 rounded-3xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[620px] group border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-200/40 dark:shadow-black/20"
            onTouchStart={(e) => {
              setTouchStartX(e.touches[0].clientX);
              setTouchEndX(null);
            }}
            onTouchMove={(e) => setTouchEndX(e.touches[0].clientX)}
            onTouchEnd={handleImageTouchEnd}
          >
            <Image
              alt="Ảnh sản phẩm chính"
              className="object-center object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              src={productImages[safeSelectedImage]}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
            />
            {productImages.length > 1 && (
              <>
                <button
                  aria-label="Ảnh trước"
                  onClick={handlePreviousImage}
                  className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 dark:bg-slate-900/85 p-2 rounded-full shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-900 dark:text-white" />
                </button>
                <button
                  aria-label="Ảnh tiếp theo"
                  onClick={handleNextImage}
                  className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 dark:bg-slate-900/85 p-2 rounded-full shadow-md"
                >
                  <ChevronRight className="w-4 h-4 text-slate-900 dark:text-white" />
                </button>
              </>
            )}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              {safeSelectedImage + 1}/{productImages.length}
            </div>
            <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/25 backdrop-blur">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    aria-label={`Chọn ảnh ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={`h-1.5 rounded-full transition-all ${safeSelectedImage === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-5 md:p-6 shadow-lg shadow-slate-200/40 dark:shadow-black/20 transition-all duration-200 hover:shadow-xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-bold text-slate-900 dark:text-white mb-2">
              {product.name}
            </h1>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
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
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-center">
                <p className="text-xs text-slate-500">Đánh giá</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {product.reviews.averageRating.toFixed(1)}/5
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-center">
                <p className="text-xs text-slate-500">Lượt đánh giá</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {product.reviews.totalReviews}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(currentPrice)}
              </p>
              {stockAvailable > 0 ? (
                <span
                  className={`text-sm font-medium mb-1 ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
                >
                  {isLowStock
                    ? `Sắp hết hàng (${stockAvailable})`
                    : `Còn ${stockAvailable} sản phẩm`}
                </span>
              ) : (
                <span className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                  Tạm hết hàng
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Điểm nổi bật
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" />
                  Chất liệu cao cấp, mặc thoải mái cả ngày
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" />
                  Form chuẩn, dễ phối cho nhiều phong cách
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-green-600" />
                  Kiểm tra hàng trước khi thanh toán
                </li>
              </ul>
            </div>

            {variantSku && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                SKU: {variantSku}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-5 md:p-6 shadow-lg shadow-slate-200/40 dark:shadow-black/20 transition-all duration-200 hover:shadow-xl">
            {availableColors.length > 0 && (
              <div className="mb-5 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Màu sắc:{" "}
                    <span className="text-slate-500 font-normal">
                      {isColorSelected ? currentSelectedColor : "Chưa chọn"}
                    </span>
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        !option.disabled && handleColorChange(option.value)
                      }
                      disabled={option.disabled}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${currentSelectedColor === option.value ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent font-bold shadow-lg shadow-slate-200 dark:shadow-none" : "border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500"} ${option.disabled ? "opacity-40 cursor-not-allowed hover:border-slate-200 dark:hover:border-slate-700" : ""}`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Kích cỡ:{" "}
                    <span className="text-slate-500 font-normal">
                      {isSizeSelected ? currentSelectedSize : "Chưa chọn"}
                    </span>
                  </h3>
                </div>
                {availableSizesForCurrentColor.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {sizeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            !option.disabled && handleSizeChange(option.value)
                          }
                          disabled={option.disabled}
                          className={`h-12 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${currentSelectedSize === option.value ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent font-bold shadow-lg shadow-slate-200 dark:shadow-none" : "border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500"} ${option.disabled ? "opacity-40 cursor-not-allowed hover:border-slate-200 dark:hover:border-slate-700" : ""}`}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Mẹo: các tùy chọn mờ là tổ hợp không khả dụng hoặc đã hết
                      hàng.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Màu này hiện chưa có size khả dụng.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-5 md:p-6 shadow-lg shadow-slate-200/40 dark:shadow-black/20 flex flex-col gap-4 transition-all duration-200 hover:shadow-xl">
            <div className="hidden md:flex gap-4">
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
                  value={safeQuantity}
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={!canPurchase || safeQuantity >= maxAllowedQuantity}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addToCartDisabled}
                className="h-14 px-5 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-slate-100 hover:border-primary hover:text-primary dark:hover:text-primary transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {canPurchase ? "Thêm vào giỏ" : "Hết hàng"}
                  </>
                )}
              </button>
              <button className="h-14 w-14 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 bg-white dark:bg-slate-800 transition-colors group">
                <Heart className="w-5 h-5 group-hover:fill-current" />
              </button>
            </div>
            <Link
              href="/cart"
              className="hidden md:flex w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.99] items-center justify-center"
            >
              Đến giỏ hàng
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <MessageCircle className="size-4" />
              <span>Tư vấn chọn size trong 1 phút qua chat</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Miễn phí vận chuyển
                </p>
                <p className="text-xs text-slate-500">Đơn hàng trên 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Thanh toán an toàn
                </p>
                <p className="text-xs text-slate-500">Bảo mật 100%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Đổi trả 30 ngày
                </p>
                <p className="text-xs text-slate-500">
                  Hỗ trợ đổi size/màu nếu còn tem mác và chưa sử dụng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 md:mt-20 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur px-4 md:px-6 lg:px-8">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav aria-label="Tabs" className="-mb-px hidden md:flex space-x-8">
            {detailTabs.map((tab) => (
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

        <div className="py-8 text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl hidden md:block">
          {renderTabContent(activeTab)}
        </div>

        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700 border-y border-slate-200 dark:border-slate-700">
          {detailTabs.map((tab) => {
            const expanded = activeTab === tab.id;

            return (
              <section key={tab.id} className="py-4">
                <button
                  onClick={() => setActiveTab(expanded ? "" : tab.id)}
                  className="w-full flex items-center justify-between text-left font-semibold text-slate-900 dark:text-white"
                >
                  <span>{tab.label}</span>
                  <span className="text-slate-500">{expanded ? "−" : "+"}</span>
                </button>
                {expanded && (
                  <div className="pt-3 text-slate-600 dark:text-slate-300">
                    {renderTabContent(tab.id)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="max-w-360 mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">Giá</p>
            <p className="text-base font-bold text-primary truncate">
              {formatPrice(currentPrice)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {canPurchase
                ? "Có thể giao trong 2-5 ngày"
                : "Sản phẩm đang tạm hết"}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addToCartDisabled}
            className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingToCart ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ShoppingBag className="size-5" />
            )}
          </button>
          <Link
            href="/cart"
            className="flex-1 h-11 px-4 rounded-lg bg-primary hover:bg-orange-600 text-white font-bold transition-colors flex items-center justify-center"
          >
            Đến giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
