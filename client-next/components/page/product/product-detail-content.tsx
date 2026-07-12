"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ProductDetail } from "@/types/product";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { useProductDwellTracking } from "@/hooks/use-product-dwell-tracking";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/hooks/use-product-favorites";
import { RecommendationShelf } from "../recommendation-shelf";
import { useAuthStore } from "@/stores/auth.store";
import { VirtualTryOnModal } from "./virtual-try-on-modal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface ProductDetailContentProps {
  product: ProductDetail;
}

interface VariantOptionState {
  key: string;
  value: string;
  disabled: boolean;
  outOfStock: boolean;
}

interface VariantAxis {
  key: string;
  label: string;
  sourceKeys: string[];
  values: string[];
}

function parseSizeValues(rawSize?: string): string[] {
  if (!rawSize) return [];

  return rawSize
    .split(/[,/|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAttributeKey(key: string): string {
  return key
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function toAttributeValues(raw: unknown, key?: string): string[] {
  if (raw === null || raw === undefined) return [];

  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  const value = String(raw).trim();
  if (!value) return [];

  const normalizedKey = normalizeAttributeKey(key ?? "");

  if (normalizedKey.includes("size") || normalizedKey.includes("kich")) {
    return parseSizeValues(value);
  }

  return [value];
}

function toAttributeLabel(key: string): string {
  const labels: Record<string, string> = {
    color: "Màu sắc",
    mau: "Màu sắc",
    mau_sac: "Màu sắc",
    size: "Kích cỡ",
    kich_co: "Kích cỡ",
    kich_thuoc: "Kích cỡ",
  };

  return (
    labels[normalizeAttributeKey(key)] ??
    key
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (char) => char.toUpperCase())
  );
}

function isColorAttributeKey(key: string): boolean {
  const normalizedKey = normalizeAttributeKey(key);
  return ["color", "mau", "mau_sac"].includes(normalizedKey);
}

function isSizeAttributeKey(key: string): boolean {
  const normalizedKey = normalizeAttributeKey(key);
  return normalizedKey.includes("size") || normalizedKey.includes("kich");
}

function toCanonicalVariantKey(key: string): string {
  if (isColorAttributeKey(key)) return "color";
  if (isSizeAttributeKey(key)) return "size";
  return normalizeAttributeKey(key).replace(/[^a-z0-9]+/g, "_");
}

function getVariantAxisValues(
  variant: ProductDetail["variants"][number],
  axis: Pick<VariantAxis, "sourceKeys">,
): string[] {
  const valueGroups = axis.sourceKeys
    .map((key) => toAttributeValues(variant.attributes?.[key], key))
    .filter((values) => values.length > 0);

  if (valueGroups.length === 0) return [];

  const singleValueGroups = valueGroups.filter((values) => values.length === 1);
  const groupsToUse =
    singleValueGroups.length > 0 ? singleValueGroups : valueGroups;

  return [...new Set(groupsToUse.flat())];
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

function decodeHtmlEntities(raw: string): string {
  if (!raw) return "";

  return raw.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body) => {
    if (body[0] === "#") {
      const isHex = body[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(
        body.slice(isHex ? 2 : 1),
        isHex ? 16 : 10,
      );
      return Number.isFinite(codePoint)
        ? String.fromCodePoint(codePoint)
        : entity;
    }

    const named: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
    };

    return named[body.toLowerCase()] ?? entity;
  });
}

function sanitizeRichTextHtml(raw: string): string {
  if (!raw) return "";

  const allowedTags = new Set([
    "b",
    "strong",
    "br",
    "p",
    "ul",
    "ol",
    "li",
    "div",
  ]);

  return decodeHtmlEntities(raw)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*\/?\s*([a-z0-9-]+)\b[^>]*>/gi, (tag, tagName) => {
      const normalizedTag = String(tagName).toLowerCase();
      if (!allowedTags.has(normalizedTag)) return "";

      if (normalizedTag === "br") return "<br>";

      const isClosingTag = /^<\s*\//.test(tag);
      return isClosingTag ? `</${normalizedTag}>` : `<${normalizedTag}>`;
    });
}

function stripHtmlToText(raw: string): string {
  return sanitizeRichTextHtml(raw)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isVirtualTryOnOpen, setIsVirtualTryOnOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(null);
  const lastGestureWasSwipeRef = useRef(false);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const productAttributeByCode = useMemo(() => {
    const map = new Map<string, (typeof product.productAttributes)[number]>();
    (product.productAttributes ?? []).forEach((attr) => {
      map.set(attr.code, attr);
    });
    return map;
  }, [product]);

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

  const productDescriptionHtml = useMemo(
    () => sanitizeRichTextHtml(product.description ?? ""),
    [product.description],
  );

  const productDescriptionText = useMemo(
    () => stripHtmlToText(product.description ?? ""),
    [product.description],
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

  const dwellTrackingMetadata = useMemo(
    () => ({
      basePrice: product.basePrice,
    }),
    [product.basePrice],
  );

  useProductDwellTracking({
    productId: product.id,
    productName: product.name,
    source: "product_detail_dwell",
    placement: "product_detail_page",
    thresholdMs: 5000,
    metadata: dwellTrackingMetadata,
  });

  const isFavorite = favoriteIds.has(product.id);
  const isTogglingFavorite =
    toggleFavorite.isPending &&
    toggleFavorite.variables?.productId === product.id;

  const variantAxes = useMemo<VariantAxis[]>(() => {
    const sourceKeysByAxis = new Map<string, string[]>();

    product.variants.forEach((variant) => {
      Object.entries(variant.attributes ?? {}).forEach(([key, value]) => {
        if (toAttributeValues(value, key).length === 0) return;

        const axisKey = toCanonicalVariantKey(key);
        const sourceKeys = sourceKeysByAxis.get(axisKey) ?? [];
        if (!sourceKeys.includes(key)) {
          sourceKeys.push(key);
          sourceKeysByAxis.set(axisKey, sourceKeys);
        }
      });
    });

    return Array.from(sourceKeysByAxis.entries())
      .map(([key, sourceKeys]) => {
        const labelSourceKey =
          sourceKeys.find(
            (sourceKey) => toCanonicalVariantKey(sourceKey) === key,
          ) ?? sourceKeys[0];

        return {
          key,
          label: toAttributeLabel(labelSourceKey),
          sourceKeys,
          values: [
            ...new Set(
              product.variants.flatMap((variant) =>
                getVariantAxisValues(variant, { sourceKeys }),
              ),
            ),
          ],
        };
      })
      .filter((axis) => axis.values.length > 0);
  }, [product.variants]);

  const currentSelectedOptions = useMemo(
    () =>
      Object.fromEntries(
        variantAxes.map((axis) => [
          axis.key,
          selectedOptions[axis.key] || axis.values[0] || "",
        ]),
      ),
    [selectedOptions, variantAxes],
  );

  const variantMatchesSelection = useCallback(
    (
      variant: ProductDetail["variants"][number],
      selection: Record<string, string>,
    ) =>
      variantAxes.every((axis) => {
        const selected = selection[axis.key];
        return (
          !selected || getVariantAxisValues(variant, axis).includes(selected)
        );
      }),
    [variantAxes],
  );

  const selectedVariant = useMemo(
    () =>
      product.variants.find((variant) =>
        variantMatchesSelection(variant, currentSelectedOptions),
      ) || product.variants[0],
    [product.variants, currentSelectedOptions, variantMatchesSelection],
  );

  const colorAxis = useMemo(
    () => variantAxes.find((axis) => isColorAttributeKey(axis.key)),
    [variantAxes],
  );

  const currentSelectedColor = colorAxis
    ? currentSelectedOptions[colorAxis.key]
    : "";

  const currentSelectedSize = useMemo(
    () =>
      variantAxes
        .filter((axis) => isSizeAttributeKey(axis.key))
        .map((axis) => currentSelectedOptions[axis.key])
        .find(Boolean) ?? "",
    [currentSelectedOptions, variantAxes],
  );

  const variantOptionsByAxis = useMemo(
    () =>
      Object.fromEntries(
        variantAxes.map((axis) => [
          axis.key,
          axis.values.map((value) => {
            const matchingVariants = product.variants.filter((variant) =>
              getVariantAxisValues(variant, axis).includes(value),
            );
            const outOfStock =
              matchingVariants.length > 0 &&
              matchingVariants.every((variant) => variant.stockAvailable <= 0);

            return {
              key: axis.key,
              value,
              disabled: matchingVariants.length === 0 || outOfStock,
              outOfStock,
            };
          }),
        ]),
      ) as Record<string, VariantOptionState[]>,
    [product.variants, variantAxes],
  );

  useEffect(() => {
    setSelectedOptions((prev) => {
      const next: Record<string, string> = {};
      let changed = false;

      for (const axis of variantAxes) {
        const current = prev[axis.key];
        next[axis.key] =
          current && axis.values.includes(current)
            ? current
            : axis.values[0] || "";
        changed ||= next[axis.key] !== current;
      }

      changed ||= Object.keys(prev).some((key) => !(key in next));
      return changed ? next : prev;
    });
  }, [variantAxes]);

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
          (v) =>
            colorAxis &&
            getVariantAxisValues(v, colorAxis).includes(currentSelectedColor),
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
  }, [
    product.variants,
    product.images,
    currentSelectedColor,
    selectedVariant,
    colorAxis,
  ]);

  const originalPrice =
    selectedVariant?.originalPrice ??
    selectedVariant?.price ??
    product.basePrice;
  const currentPrice = selectedVariant?.salePrice ?? originalPrice;
  const hasPromotion = currentPrice < originalPrice;
  const stockAvailable = selectedVariant ? selectedVariant.stockAvailable : 0;
  const canPurchase = stockAvailable > 0;
  const isLowStock = stockAvailable > 0 && stockAvailable <= 5;
  const requiredAxes = variantAxes.filter((axis) => axis.values.length > 1);
  const hasRequiredOptionSelection = requiredAxes.every((axis) =>
    Boolean(currentSelectedOptions[axis.key]),
  );
  const styleNotes = [
    {
      title: "Style notes",
      copy:
        fitNote ||
        stripHtmlToText(productStory) ||
        productDescriptionText ||
        "Phom dáng được giữ gọn để dễ phối cùng những item nền tảng trong tủ đồ.",
    },
    {
      title: "Material & care",
      copy:
        careInstruction ||
        "Giữ sản phẩm ở nơi khô thoáng, giặt nhẹ và phơi tránh nắng trực tiếp để form bền hơn.",
    },
    {
      title: "Hoàn cảnh sử dụng",
      copy:
        usageOccasionLabels.length > 0
          ? `Phù hợp cho ${usageOccasionLabels.join(", ").toLowerCase()}.`
          : "Dễ đi cùng lịch trình hằng ngày: văn phòng, cà phê cuối tuần hoặc những buổi gặp nhẹ.",
    },
  ];

  // Ensure selected image is within bounds
  const safeSelectedImage = Math.min(selectedImage, productImages.length - 1);

  const handleQuantityChange = (delta: number) => {
    const maxQuantity = stockAvailable > 0 ? Math.min(stockAvailable, 10) : 1;
    setQuantity((prev) => Math.min(maxQuantity, Math.max(1, prev + delta)));
  };

  const handleOptionChange = (key: string, value: string) => {
    const preferredSelection = {
      ...currentSelectedOptions,
      [key]: value,
    };

    const exactMatch = product.variants.find(
      (variant) =>
        variant.stockAvailable > 0 &&
        variantMatchesSelection(variant, preferredSelection),
    );

    const fallbackMatch = product.variants.find(
      (variant) =>
        variant.stockAvailable > 0 &&
        variantAxes.some(
          (axis) =>
            axis.key === key &&
            getVariantAxisValues(variant, axis).includes(value),
        ),
    );

    const nextVariant = exactMatch ?? fallbackMatch;
    if (!nextVariant) {
      setSelectedOptions(preferredSelection);
      setSelectedImage(0);
      return;
    }

    setSelectedOptions(
      Object.fromEntries(
        variantAxes.map((axis) => [
          axis.key,
          getVariantAxisValues(nextVariant, axis)[0] ??
            preferredSelection[axis.key] ??
            "",
        ]),
      ),
    );
    setSelectedImage(0);
  };

  const handleOpenVirtualTryOn = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng thử đồ.");
      return;
    }
    setIsVirtualTryOnOpen(true);
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
          {productDescriptionHtml ? (
            <div
              className="whitespace-pre-line [&_li]:ml-5 [&_li]:list-disc"
              dangerouslySetInnerHTML={{ __html: productDescriptionHtml }}
            />
          ) : null}
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

  const fallbackVariant = product.variants[0];
  const variantSku = (selectedVariant || fallbackVariant)?.sku;
  const hasSellableVariant = product.variants.length > 0;
  const maxAllowedQuantity = canPurchase ? Math.min(stockAvailable, 10) : 1;
  const safeQuantity = canPurchase ? Math.min(quantity, maxAllowedQuantity) : 1;
  const addToCartDisabled =
    isAddingToCart ||
    !hasSellableVariant ||
    !canPurchase ||
    !hasRequiredOptionSelection ||
    !selectedVariant?.id;

  const handleAddToCart = () => {
    if (!hasSellableVariant) {
      toast.warning("Sản phẩm chưa cấu hình phiên bản bán");
      return;
    }

    if (!hasRequiredOptionSelection) {
      toast.warning("Vui lòng chọn đủ phân loại sản phẩm");
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
      productId: product.id,
      source: "product_detail",
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
      <main className="luxury-page grow px-4 py-10 pb-28 text-[#222222] dark:text-neutral-100 sm:px-6 md:pb-10 lg:px-8">
        <div className="mx-auto w-full max-w-330">
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
              <li aria-current="page" className="min-w-0">
                <div className="flex min-w-0 items-center">
                  <ChevronRight className="text-neutral-400 w-4 h-4 mx-1" />
                  <span
                    className="max-w-[42vw] truncate text-sm font-medium text-neutral-900 dark:text-white md:max-w-[520px]"
                    title={product.name}
                  >
                    {product.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-10">
            <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
              <div
                className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] md:h-155 md:w-24 md:flex-col md:overflow-y-auto md:pb-0 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 w-20 shrink-0 overflow-hidden border transition-all duration-200 md:h-24 md:w-full ${safeSelectedImage === index ? "scale-[1.02] border-black shadow-sm dark:border-white" : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"}`}
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
                className="group relative aspect-4/5 flex-1 cursor-zoom-in overflow-hidden border border-black/10 bg-neutral-100 shadow-sm dark:border-white/10 dark:bg-neutral-900 md:h-155 md:aspect-auto"
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

            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="sticky top-24 border-y border-black/10 bg-[#f7f3ec]/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/75">
                <p className="luxury-eyebrow mb-3">Product atelier</p>
                <h1
                  className="mb-4 line-clamp-5 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-neutral-900 dark:text-white md:text-5xl"
                  title={product.name}
                >
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
                    {Math.max(0, product.reviews.totalReviews * 3)} đã bán
                  </span>
                </div>

                <div className="mt-4 flex items-end gap-3 border-y border-black/10 py-4 dark:border-white/10">
                  {hasPromotion ? (
                    <span className="text-base text-neutral-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  ) : null}
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-black dark:text-white">
                    {formatPrice(currentPrice)}
                  </span>
                  {stockAvailable > 0 ? (
                    <span
                      className={`text-xs font-medium mb-1 ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
                    ></span>
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                      Tạm hết hàng
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {(usageOccasionLabels.length > 0 ||
                    targetAgeLabels.length > 0) && (
                    <div className="space-y-2 border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                      {usageOccasionLabels.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                            Mục đích:
                          </span>
                          {usageOccasionLabels.map((label) => (
                            <span
                              key={label}
                              className="border border-black/10 bg-white/65 px-2.5 py-1 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
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
                              className="border border-black/10 bg-white/65 px-2.5 py-1 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
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

                  {variantAxes.map((axis) => (
                    <div key={axis.key} className="flex items-start gap-4">
                      <span className="w-24 shrink-0 text-sm text-neutral-500">
                        {axis.label}
                      </span>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(variantOptionsByAxis[axis.key] ?? []).map(
                            (option) => (
                              <button
                                key={option.value}
                                onClick={() =>
                                  !option.disabled &&
                                  handleOptionChange(axis.key, option.value)
                                }
                                disabled={option.disabled}
                                className={`min-w-12 border px-3 py-2 text-sm transition-colors ${currentSelectedOptions[axis.key] === option.value ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/20 text-neutral-800 dark:border-white/20 dark:text-neutral-100"} ${option.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                              >
                                {option.value}
                              </button>
                            ),
                          )}
                        </div>
                        {isSizeAttributeKey(axis.key) && sizeGuideImageUrl ? (
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
                  ))}

                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-neutral-500">
                      Số lượng
                    </span>
                    <div className="flex h-10 w-32 items-center border border-black/20 bg-white/55 dark:border-white/20 dark:bg-white/5">
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
                      className="luxury-button h-12 gap-2 px-7 py-0 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang đặt vào bag...
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
                      className="luxury-button-ghost h-12 px-10 py-0"
                    >
                      Xem giỏ hàng
                    </Link>

                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      aria-label={
                        isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"
                      }
                      className="inline-flex h-12 w-12 items-center justify-center border border-black/20 text-neutral-500 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:hover:border-white dark:hover:text-white"
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenVirtualTryOn}
                      className="inline-flex h-12 items-center justify-center gap-2 border border-black/20 px-5 text-sm font-semibold text-neutral-800 transition-colors hover:border-black hover:text-black dark:border-white/20 dark:text-neutral-100 dark:hover:border-white dark:hover:text-white"
                    >
                      <Sparkles className="size-5" />
                      Thử ngay
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

          <section className="mt-14 grid gap-px bg-black/10 dark:bg-white/10 md:mt-20 md:grid-cols-3">
            {styleNotes.map((note) => (
              <article
                key={note.title}
                className="bg-[#f7f3ec] p-6 dark:bg-neutral-950 md:p-8"
              >
                <p className="luxury-eyebrow">{note.title}</p>
                <p className="mt-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                  {note.copy}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-14 overflow-hidden bg-neutral-950 text-white md:mt-20">
            <div className="grid min-h-[460px] md:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[360px]">
                <Image
                  src={productImages[safeSelectedImage]}
                  alt={`${product.name} styling`}
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover opacity-86"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/72 via-transparent to-black/10" />
              </div>
              <div className="flex flex-col justify-center px-6 py-12 md:px-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
                  Complete the look
                </p>
                <h2 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.05em] md:text-6xl">
                  Phối cùng những lớp nền tĩnh
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
                  Bắt đầu từ item này, giữ bảng màu tinh giản và thêm một lớp
                  texture tương phản để outfit có chiều sâu mà vẫn rất gọn.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {[
                    currentSelectedColor,
                    currentSelectedSize,
                    ...usageOccasionLabels,
                  ]
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((label) => (
                      <span
                        key={label}
                        className="border border-white/18 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/68"
                      >
                        {label}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-14 border-y border-black/10 px-4 dark:border-white/10 md:mt-20 md:px-6 lg:px-8">
            <div className="border-b border-black/10 dark:border-white/10">
              <nav
                aria-label="Tabs"
                className="-mb-px hidden md:flex space-x-8"
              >
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium uppercase tracking-[0.16em] transition-colors ${activeTab === tab.id ? "border-black font-bold text-black dark:border-white dark:text-white" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-200"}`}
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

          <section className="mt-14 md:mt-20">
            <RecommendationShelf
              kind="product"
              productId={product.id}
              placement="product_detail_recommendations"
              title="Bạn có thể cũng thích"
              emptyMessage="Khám phá thêm vài item để AURA chọn phối đồ sát mood hơn."
            />
          </section>

          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#f7f3ec]/92 shadow-[0_-8px_24px_rgba(10,10,10,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/92 md:hidden">
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
                className="h-11 w-11 shrink-0 border border-black/20 text-neutral-700 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:text-neutral-100 flex items-center justify-center"
              >
                {isAddingToCart ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ShoppingBag className="size-5" />
                )}
              </button>
              <Link
                href="/cart"
                className="luxury-button h-11 flex-1 px-4 py-0"
              >
                Xem bag
              </Link>
            </div>
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

      <VirtualTryOnModal
        product={product}
        productImageUrl={productImages[safeSelectedImage]}
        open={isVirtualTryOnOpen}
        onClose={() => setIsVirtualTryOnOpen(false)}
      />
    </>
  );
}
