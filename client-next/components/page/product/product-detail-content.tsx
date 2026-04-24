"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ZoomIn,
  X,
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
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/hooks/use-product-favorites";
import { useRelatedProductsFromMyOrders } from "@/hooks/use-products";
import { useAuthStore } from "@/stores/auth.store";
import { ProductCard } from "../product-card";

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

function toDisplayLabels(
  value: string | string[] | null | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function toSingleText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item))
      .filter(Boolean)
      .join(", ");
  }
  return String(value).trim();
}

function sanitizeRichTextHtml(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/<(?!\/?(b|strong|br|p|ul|ol|li)\b)[^>]*>/gi, "")
    .replace(/\s(on\w+|style)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(null);
  const lastGestureWasSwipeRef = useRef(false);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const relatedProductsQuery = useRelatedProductsFromMyOrders(
    12,
    isAuthenticated,
  );
  const relatedProducts = relatedProductsQuery.data?.products ?? [];

  const productAttributeByCode = useMemo(() => {
    const map = new Map<string, (typeof product.productAttributes)[number]>();
    (product.productAttributes ?? []).forEach((attr) => {
      map.set(attr.code, attr);
    });
    return map;
  }, [product.productAttributes]);

  const usageOccasionLabels = useMemo(
    () =>
      toDisplayLabels(
        productAttributeByCode.get("usage_occasions")?.displayValue,
      ),
    [productAttributeByCode],
  );

  const targetAgeLabels = useMemo(
    () =>
      toDisplayLabels(
        productAttributeByCode.get("target_age_group")?.displayValue,
      ),
    [productAttributeByCode],
  );

  const productStory = useMemo(
    () => toSingleText(productAttributeByCode.get("product_story")?.value),
    [productAttributeByCode],
  );

  const productStoryHtml = useMemo(
    () => sanitizeRichTextHtml(productStory),
    [productStory],
  );

  const careInstruction = useMemo(
    () => toSingleText(productAttributeByCode.get("care_instruction")?.value),
    [productAttributeByCode],
  );

  const fitNote = useMemo(
    () => toSingleText(productAttributeByCode.get("fit_note")?.value),
    [productAttributeByCode],
  );

  const sizeGuideImageUrl = useMemo(
    () =>
      toSingleText(productAttributeByCode.get("size_guide_image_url")?.value),
    [productAttributeByCode],
  );

  const seoTitle = useMemo(
    () => toSingleText(productAttributeByCode.get("seo_title")?.value),
    [productAttributeByCode],
  );

  const seoDescription = useMemo(
    () => toSingleText(productAttributeByCode.get("seo_description")?.value),
    [productAttributeByCode],
  );

  const seoKeywordLabels = useMemo(() => {
    const raw = toSingleText(productAttributeByCode.get("seo_keywords")?.value);
    if (!raw) return [];

    return raw
      .split(/[,;|]/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }, [productAttributeByCode]);

  const isFavorite = favoriteIds.has(product.id);
  const isTogglingFavorite =
    toggleFavorite.isPending &&
    toggleFavorite.variables?.productId === product.id;

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
    const uniqueImages: string[] = [];

    const pushUnique = (url: string | undefined | null) => {
      if (!url) return;
      if (!uniqueImages.includes(url)) {
        uniqueImages.push(url);
      }
    };

    const variantsForGallery = currentSelectedColor
      ? product.variants.filter(
          (v) => v.attributes.color === currentSelectedColor,
        )
      : product.variants;

    const prioritizedVariants = selectedVariant
      ? [
          selectedVariant,
          ...variantsForGallery.filter((v) => v.id !== selectedVariant.id),
        ]
      : variantsForGallery;

    prioritizedVariants.forEach((variant) => {
      variant.images
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((img) => pushUnique(img.url));
    });

    if (uniqueImages.length === 0) {
      product.images
        .slice()
        .sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        })
        .forEach((img) => pushUnique(img.url));
    }

    return uniqueImages.length > 0 ? uniqueImages : [FALLBACK_IMAGE];
  }, [product.variants, product.images, currentSelectedColor, selectedVariant]);

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product.basePrice;
  const variantColorLabel = selectedVariant?.attributes.color || "-";
  const variantSizeLabel =
    currentSelectedSize || selectedVariant?.attributes.size || "-";
  const stockAvailable = selectedVariant ? selectedVariant.stockAvailable : 0;
  const canPurchase = stockAvailable > 0;
  const isLowStock = stockAvailable > 0 && stockAvailable <= 5;
  const requiresColorSelection = availableColors.length > 1;
  const requiresSizeSelection = availableSizesForCurrentColor.length > 1;
  const isColorSelected =
    !requiresColorSelection || Boolean(currentSelectedColor);
  const isSizeSelected = !requiresSizeSelection || Boolean(currentSelectedSize);

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

  const formatReviewDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const renderTabContent = (tabId: string) => {
    if (tabId === "description") {
      return (
        <div className="space-y-4">
          <p className="whitespace-pre-line">{product.description}</p>
          {productStory ? (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Thông tin chi tiết sản phẩm
              </h4>
              <div
                className="mt-2 whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300 [&_li]:ml-5 [&_li]:list-disc"
                dangerouslySetInnerHTML={{ __html: productStoryHtml }}
              />
            </div>
          ) : null}
          {careInstruction ? (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Hướng dẫn bảo quản
              </h4>
              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {careInstruction}
              </p>
            </div>
          ) : null}
          {seoKeywordLabels.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Từ khóa liên quan
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {seoKeywordLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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

    if (tabId === "fit") {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
              Phù hợp cho mục đích
            </h4>
            {usageOccasionLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {usageOccasionLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Chưa có thông tin mục đích sử dụng.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
              Độ tuổi phù hợp
            </h4>
            {targetAgeLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {targetAgeLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Chưa có thông tin độ tuổi phù hợp.
              </p>
            )}
          </div>

          {fitNote ? (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Ghi chú form dáng
              </h4>
              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {fitNote}
              </p>
            </div>
          ) : null}

          {sizeGuideImageUrl ? (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Hướng dẫn chọn size
              </h4>
              <button
                type="button"
                onClick={() => {
                  setImagePreviewSrc(sizeGuideImageUrl);
                  setIsImagePreviewOpen(true);
                }}
                className="mt-3 block w-full max-w-md overflow-hidden rounded-sm border border-neutral-200 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
              >
                <Image
                  src={sizeGuideImageUrl}
                  alt="Ảnh hướng dẫn chọn size"
                  width={900}
                  height={1200}
                  className="h-auto w-full object-cover"
                />
                <p className="border-t border-neutral-200 px-3 py-2 text-left text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                  Chạm để phóng to ảnh bảng size
                </p>
              </button>
            </div>
          ) : null}
        </div>
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
      <div className="space-y-6">
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

        {product.reviewItems?.length > 0 ? (
          <div className="space-y-4 pt-2">
            {product.reviewItems.map((review) => (
              <div
                key={review.id}
                className="rounded-sm border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {review.author?.label || "Khách hàng"}
                      </p>
                      <span className="text-xs text-slate-500">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-yellow-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(review.rating || 0) ? "fill-current" : "text-slate-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {review.comment ? (
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                    {review.comment}
                  </p>
                ) : null}

                {review.images?.length ? (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {review.images
                      .slice()
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          aria-label="Xem ảnh đánh giá"
                          onClick={() => {
                            setImagePreviewSrc(img.url);
                            setIsImagePreviewOpen(true);
                          }}
                          className="relative aspect-square overflow-hidden rounded-sm border border-neutral-200 dark:border-neutral-800"
                        >
                          <Image
                            alt="Ảnh đánh giá"
                            src={img.url}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 25vw, 10vw"
                          />
                        </button>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const detailTabs = [
    { id: "description", label: "Mô tả" },
    { id: "fit", label: "Phù hợp sử dụng" },
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
  const hasSellableVariant = product.variants.length > 0;
  const maxAllowedQuantity = canPurchase ? Math.min(stockAvailable, 10) : 1;
  const safeQuantity = canPurchase ? Math.min(quantity, maxAllowedQuantity) : 1;
  const addToCartDisabled =
    isAddingToCart ||
    !hasSellableVariant ||
    !canPurchase ||
    !isColorSelected ||
    !isSizeSelected ||
    !selectedVariant?.id;

  const handleAddToCart = () => {
    if (!hasSellableVariant) {
      toast.warning("Sản phẩm chưa cấu hình phiên bản bán");
      return;
    }

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

  const handleToggleFavorite = () => {
    if (isTogglingFavorite) {
      return;
    }

    toggleFavorite.mutate({
      productId: product.id,
      isFavorite,
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

  const handleOpenImagePreview = () => {
    if (lastGestureWasSwipeRef.current) {
      lastGestureWasSwipeRef.current = false;
      return;
    }

    setImagePreviewSrc(productImages[safeSelectedImage]);
    setIsImagePreviewOpen(true);
  };

  const handleCloseImagePreview = () => {
    setIsImagePreviewOpen(false);
    setImagePreviewSrc(null);
  };

  const handleImageTouchEnd = () => {
    lastGestureWasSwipeRef.current = false;
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (Math.abs(diff) < minSwipeDistance) return;

    lastGestureWasSwipeRef.current = true;
    if (diff > 0) {
      handleNextImage();
      return;
    }

    handlePreviousImage();
  };

  useEffect(() => {
    if (!isImagePreviewOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseImagePreview();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isImagePreviewOpen]);

  return (
    <>
      <main className="grow w-full max-w-330 mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10 text-[#222222] dark:text-neutral-100">
        <nav aria-label="Breadcrumb" className="flex mb-6">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                Trang chủ
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="text-neutral-400 w-4 h-4 mx-1" />
                <Link
                  href="/"
                  className="text-sm font-medium text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  {product.categories[0]?.name || "Sản phẩm"}
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRight className="text-neutral-400 w-4 h-4 mx-1" />
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {product.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 rounded-sm border border-neutral-200 bg-white p-4 md:p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
            <div
              className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 md:h-155 pb-1 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {productImages.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`relative shrink-0 w-20 h-24 md:w-full md:h-24 rounded-sm overflow-hidden border-2 transition-all duration-200 ${safeSelectedImage === index ? "border-black shadow-sm scale-[1.02] dark:border-white" : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"}`}
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
              className="flex-1 relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-4/5 md:aspect-auto md:h-155 group border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-zoom-in"
              onTouchStart={(e) => {
                setTouchStartX(e.touches[0].clientX);
                setTouchEndX(null);
              }}
              onTouchMove={(e) => setTouchEndX(e.touches[0].clientX)}
              onTouchEnd={handleImageTouchEnd}
              onClick={handleOpenImagePreview}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePreviousImage();
                    }}
                    className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-900/90 p-2 rounded-full shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-900 dark:text-white" />
                  </button>
                  <button
                    aria-label="Ảnh tiếp theo"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleNextImage();
                    }}
                    className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-neutral-900/90 p-2 rounded-full shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-900 dark:text-white" />
                  </button>
                </>
              )}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm">
                {safeSelectedImage + 1}/{productImages.length}
              </div>
              <button
                aria-label="Xem ảnh lớn"
                onClick={(event) => {
                  event.stopPropagation();
                  setImagePreviewSrc(productImages[safeSelectedImage]);
                  setIsImagePreviewOpen(true);
                }}
                className="absolute bottom-4 right-4 bg-white/90 dark:bg-neutral-900/90 p-2.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="w-6 h-6 text-neutral-900 dark:text-white" />
              </button>
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/25 backdrop-blur">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      aria-label={`Chọn ảnh ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedImage(index);
                      }}
                      className={`h-1.5 rounded-full transition-all ${safeSelectedImage === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <h1 className="text-2xl leading-tight font-bold uppercase text-neutral-900 dark:text-white mb-3">
                {product.name}
              </h1>

              {seoTitle && seoTitle !== product.name ? (
                <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {seoTitle}
                </p>
              ) : null}

              {seoDescription ? (
                <p className="mb-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {seoDescription}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold text-black dark:text-white">
                    {product.reviews.averageRating.toFixed(1)}
                  </span>
                  <div className="flex items-center text-yellow-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.reviews.averageRating) ? "fill-current" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-neutral-500">
                  {product.reviews.totalReviews} đánh giá
                </span>
                <span className="text-sm text-neutral-500">
                  {Math.max(10, product.reviews.totalReviews * 3)} đã bán
                </span>
              </div>

              <div className="mt-4 rounded-sm bg-neutral-100 dark:bg-neutral-800 p-4 flex items-end gap-3">
                <span className="text-base text-neutral-400 line-through">
                  {formatPrice(Math.round(currentPrice * 1.15))}
                </span>
                <span className="text-3xl font-black text-black dark:text-white">
                  {formatPrice(currentPrice)}
                </span>
                {stockAvailable > 0 ? (
                  <span
                    className={`text-xs font-medium mb-1 ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {isLowStock
                      ? `Sắp hết: ${stockAvailable}`
                      : `Kho: ${stockAvailable}`}
                  </span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                    Tạm hết hàng
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {(usageOccasionLabels.length > 0 ||
                  targetAgeLabels.length > 0) && (
                  <div className="space-y-2 rounded-sm border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
                    {usageOccasionLabels.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                          Mục đích:
                        </span>
                        {usageOccasionLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {targetAgeLabels.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                          Độ tuổi:
                        </span>
                        {targetAgeLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <span className="w-24 shrink-0 text-sm text-neutral-500">
                    Vận chuyển
                  </span>
                  <div className="text-sm text-neutral-700 dark:text-neutral-200">
                    <p className="flex items-center gap-2">
                      <Truck className="size-4 text-black dark:text-white" />
                      Nhận hàng từ 2 - 5 ngày
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Hỗ trợ đồng kiểm và đổi trả trong 30 ngày
                    </p>
                  </div>
                </div>

                {availableColors.length > 0 && (
                  <div className="flex items-start gap-4">
                    <span className="w-24 shrink-0 text-sm text-neutral-500">
                      Màu sắc
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            !option.disabled && handleColorChange(option.value)
                          }
                          disabled={option.disabled}
                          className={`px-3 py-2 rounded-sm text-sm border transition-colors ${currentSelectedColor === option.value ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100"} ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="flex items-start gap-4">
                    <span className="w-24 shrink-0 text-sm text-neutral-500">
                      Kích cỡ
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              !option.disabled && handleSizeChange(option.value)
                            }
                            disabled={option.disabled}
                            className={`min-w-12 px-3 py-2 rounded-sm text-sm border transition-colors ${currentSelectedSize === option.value ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100"} ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            {option.value}
                          </button>
                        ))}
                      </div>
                      {sizeGuideImageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewSrc(sizeGuideImageUrl);
                            setIsImagePreviewOpen(true);
                          }}
                          className="text-xs font-semibold text-neutral-700 underline underline-offset-2 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                        >
                          Xem ảnh hướng dẫn chọn size
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-sm text-neutral-500">
                    Số lượng
                  </span>
                  <div className="flex items-center h-10 border border-neutral-300 dark:border-neutral-600 rounded-sm bg-white dark:bg-neutral-800 w-32">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      className="flex-1 w-full text-center bg-transparent border-none text-neutral-900 dark:text-white font-semibold focus:ring-0 p-0"
                      readOnly
                      type="text"
                      value={safeQuantity}
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={
                        !canPurchase || safeQuantity >= maxAllowedQuantity
                      }
                      className="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {stockAvailable} sản phẩm có sẵn
                  </span>
                </div>

                {variantSku && (
                  <div className="text-xs text-neutral-500">
                    SKU: {variantSku}
                  </div>
                )}

                {!hasSellableVariant ? (
                  <div className="text-xs rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                    Sản phẩm hiện chưa có phiên bản để bán. Vui lòng quay lại
                    sau.
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={addToCartDisabled}
                    className="h-12 px-6 rounded-sm border border-black bg-white text-black font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:border-white dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Thêm vào giỏ hàng
                      </>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="h-12 px-10 rounded-sm bg-black hover:bg-neutral-800 text-white font-bold transition-colors inline-flex items-center justify-center"
                  >
                    Mua ngay
                  </Link>

                  <button
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                    aria-label={
                      isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"
                    }
                    className="h-12 w-12 border border-neutral-300 dark:border-neutral-600 rounded-sm text-neutral-500 hover:text-red-500 hover:border-red-200 transition-colors inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Heart
                      className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-4 text-black dark:text-white" />
                    Bảo mật thanh toán
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <RotateCcw className="size-4 text-black dark:text-white" />
                    Đổi trả 30 ngày
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-4 text-black dark:text-white" />
                    Chat phản hồi nhanh
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 md:mt-20 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 md:px-6 lg:px-8">
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav aria-label="Tabs" className="-mb-px hidden md:flex space-x-8">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? "border-black text-black dark:border-white dark:text-white font-bold" : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:hover:text-neutral-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8 text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-4xl hidden md:block">
            {renderTabContent(activeTab)}
          </div>

          <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-700 border-y border-neutral-200 dark:border-neutral-700">
            {detailTabs.map((tab) => {
              const expanded = activeTab === tab.id;

              return (
                <section key={tab.id} className="py-4">
                  <button
                    onClick={() => setActiveTab(expanded ? "" : tab.id)}
                    className="w-full flex items-center justify-between text-left font-semibold text-neutral-900 dark:text-white"
                  >
                    <span>{tab.label}</span>
                    <span className="text-neutral-500">
                      {expanded ? "−" : "+"}
                    </span>
                  </button>
                  {expanded && (
                    <div className="pt-3 text-neutral-600 dark:text-neutral-300">
                      {renderTabContent(tab.id)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {isAuthenticated &&
        (relatedProductsQuery.isLoading || relatedProducts.length > 0) ? (
          <section className="mt-14 md:mt-20">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Sản phẩm liên quan
              </h2>
            </div>

            {relatedProductsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500 dark:text-neutral-400">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur shadow-[0_-8px_24px_rgba(10,10,10,0.08)]">
          <div className="max-w-360 mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Giá
              </p>
              <p className="text-base font-bold text-black dark:text-white truncate">
                {formatPrice(currentPrice)}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {canPurchase
                  ? "Có thể giao trong 2-5 ngày"
                  : "Sản phẩm đang tạm hết"}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addToCartDisabled}
              className="h-11 w-11 shrink-0 rounded-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ShoppingBag className="size-5" />
              )}
            </button>
            <Link
              href="/cart"
              className="flex-1 h-11 px-4 rounded-sm bg-black hover:bg-neutral-800 text-white font-bold transition-colors flex items-center justify-center"
            >
              Đến giỏ hàng
            </Link>
          </div>
        </div>
      </main>

      {isImagePreviewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh sản phẩm"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseImagePreview();
            }
          }}
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              aria-label="Đóng"
              onClick={handleCloseImagePreview}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition-colors hover:bg-white dark:bg-neutral-900/90 dark:text-white dark:hover:bg-neutral-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-[80vh] w-full bg-neutral-100 dark:bg-neutral-800">
              <Image
                alt="Ảnh sản phẩm"
                src={imagePreviewSrc ?? productImages[safeSelectedImage]}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
