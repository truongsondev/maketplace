import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertItem,
  Header,
  InsightCard,
  MetricBar,
  OpsCard,
  SectionHeading,
  Sidebar,
} from "@/components/admin";
import {
  categoryService,
  cloudinaryService,
  productService,
  voucherService,
} from "@/services/api";
import type {
  Category,
  ProductListItem,
  VoucherItem,
  VoucherScopeType,
  VoucherType,
  VoucherUpsertCommand,
} from "@/types/api";
import {
  BadgePercent,
  Check,
  ImageIcon,
  PiggyBank,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function createInitialForm(): VoucherUpsertCommand {
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60_000);
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    code: "",
    isBirthdayVoucher: false,
    description: "",
    type: "PERCENTAGE",
    value: 10,
    maxDiscount: 20000,
    minOrderAmount: 100000,
    maxUsage: 100,
    userUsageLimit: 1,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    isActive: true,
    bannerImageUrl: "",
    scopeType: "ALL_PRODUCTS",
    includeDescendants: false,
    minAmountBasis: "ELIGIBLE_SUBTOTAL",
    includedCategoryIds: [],
    excludedCategoryIds: [],
    includedProductIds: [],
    excludedProductIds: [],
    memberTiers: [],
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const typedError = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        error?: {
          message?: string;
        };
      };
    };
  };

  return (
    typedError.response?.data?.error?.message ||
    typedError.response?.data?.message ||
    typedError.message ||
    fallback
  );
}

type VoucherDisplayStatus = "active" | "inactive" | "expired" | "depleted";

function getVoucherDisplayStatus(item: VoucherItem): VoucherDisplayStatus {
  const now = Date.now();
  const endAtMs = new Date(item.endAt).getTime();

  if (!Number.isNaN(endAtMs) && now > endAtMs) {
    return "expired";
  }

  if (item.maxUsage !== null && item.usedCount >= item.maxUsage) {
    return "depleted";
  }

  if (!item.isActive) {
    return "inactive";
  }

  return "active";
}

function getVoucherStatusBadge(status: VoucherDisplayStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "expired":
      return {
        label: "Hết hạn",
        className: "bg-red-100 text-red-700",
      };
    case "depleted":
      return {
        label: "Hết lượt",
        className: "bg-amber-100 text-amber-700",
      };
    case "inactive":
      return {
        label: "Tạm tắt",
        className: "bg-gray-100 text-gray-600",
      };
    default:
      return {
        label: "Đang hoạt động",
        className: "bg-green-100 text-green-700",
      };
  }
}

function formatVoucherTypeLabel(
  type: VoucherType,
  isBirthdayVoucher = false,
): string {
  if (isBirthdayVoucher) return "Sinh nhật";
  if (type === "PERCENTAGE") {
    return "Phần trăm";
  }

  return "Số tiền cố định";
}

type PickerOption = {
  id: string;
  label: string;
  description?: string;
};

type MultiSelectPickerProps = {
  label: string;
  placeholder: string;
  options: PickerOption[];
  selectedIds: string[];
  search: string;
  loading?: boolean;
  emptyText: string;
  onSearchChange: (value: string) => void;
  onChange: (ids: string[]) => void;
};

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((selectedId) => selectedId !== id)
    : [...ids, id];
}

function MultiSelectPicker({
  label,
  placeholder,
  options,
  selectedIds,
  search,
  loading,
  emptyText,
  onSearchChange,
  onChange,
}: MultiSelectPickerProps) {
  const optionById = new Map(options.map((option) => [option.id, option]));
  const selectedOptions = selectedIds.map(
    (id) =>
      optionById.get(id) ?? {
        id,
        label: id,
        description: "Đã chọn trước đó",
      },
  );

  return (
    <div className="space-y-2 text-sm text-gray-700 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Bỏ chọn tất cả
          </button>
        ) : null}
      </div>

      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400">Chưa chọn mục nào</span>
        ) : (
          selectedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange(selectedIds.filter((id) => id !== option.id))
              }
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              title={option.description || option.id}
            >
              <span className="truncate">{option.label}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))
        )}
      </div>

      <div className="rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-200 px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 w-full border-0 text-sm outline-none"
            placeholder={placeholder}
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-2">
          {loading ? (
            <p className="px-2 py-3 text-sm text-gray-500">Đang tải dữ liệu...</p>
          ) : options.length === 0 ? (
            <p className="px-2 py-3 text-sm text-gray-500">{emptyText}</p>
          ) : (
            options.map((option) => {
              const checked = selectedIds.includes(option.id);

              return (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(toggleId(selectedIds, option.id))}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-xs text-gray-500">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function buildCategoryOptions(
  categories: Category[],
  search: string,
): PickerOption[] {
  const byParent = new Map<string | null, Category[]>();
  for (const category of categories) {
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }

  const flattened: Array<Category & { depth: number }> = [];
  const visit = (parentId: string | null, depth: number) => {
    const children = [...(byParent.get(parentId) ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
    for (const child of children) {
      flattened.push({ ...child, depth });
      visit(child.id, depth + 1);
    }
  };
  visit(null, 0);

  const normalizedSearch = search.trim().toLowerCase();
  return flattened
    .filter((category) =>
      normalizedSearch
        ? `${category.name} ${category.slug}`
            .toLowerCase()
            .includes(normalizedSearch)
        : true,
    )
    .map((category) => ({
      id: category.id,
      label: `${"— ".repeat(category.depth)}${category.name}`,
      description: category.parentId ? "Danh mục con" : "Danh mục gốc",
    }));
}

function formatProductPrice(product: ProductListItem): string {
  const min = product.variantsSummary.priceRange.min;
  const max = product.variantsSummary.priceRange.max;

  if (min === max) {
    return `${min.toLocaleString("vi-VN")} đ`;
  }

  return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} đ`;
}

type ProductSelectFieldProps = {
  label: string;
  placeholder: string;
  products: ProductListItem[];
  selectedIds: string[];
  search: string;
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onChange: (ids: string[]) => void;
};

function ProductSelectField({
  label,
  placeholder,
  products,
  selectedIds,
  search,
  loading,
  onSearchChange,
  onChange,
}: ProductSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const productById = new Map(products.map((product) => [product.id, product]));
  const selectedProducts = selectedIds.map((id) => productById.get(id)).filter(Boolean) as ProductListItem[];
  const missingSelectedIds = selectedIds.filter((id) => !productById.has(id));

  const removeId = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="space-y-2 text-sm text-gray-700 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Bỏ chọn tất cả
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-12 w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left hover:border-blue-400 hover:bg-blue-50/40"
      >
        <span className={selectedIds.length ? "font-medium text-gray-900" : "text-gray-400"}>
          {selectedIds.length
            ? `Đã chọn ${selectedIds.length} sản phẩm`
            : "Chưa chọn sản phẩm nào"}
        </span>
        <span className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
          Mở danh sách
        </span>
      </button>

      {selectedIds.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {selectedProducts.slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                {product.primaryImage?.url ? (
                  <img
                    src={product.primaryImage.url}
                    alt={product.primaryImage.altText || product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-950" title={product.name}>
                  {product.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {formatProductPrice(product)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeId(product.id)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Bỏ sản phẩm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {missingSelectedIds.map((id) => (
            <div
              key={id}
              className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="truncate text-gray-600">{id}</span>
              <button
                type="button"
                onClick={() => removeId(id)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Bỏ sản phẩm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {selectedIds.length > selectedProducts.slice(0, 4).length + missingSelectedIds.length ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              Xem thêm sản phẩm đã chọn
            </button>
          ) : null}
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-950">{label}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chọn theo ảnh, tên sản phẩm, danh mục và khoảng giá để tránh nhầm sản phẩm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-200 px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="h-11 w-full border-0 text-sm outline-none"
                  placeholder={placeholder}
                />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
              <div className="min-h-0 overflow-y-auto p-5">
                {loading ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    Đang tải sản phẩm...
                  </p>
                ) : products.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    Không tìm thấy sản phẩm phù hợp.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => {
                      const checked = selectedIds.includes(product.id);

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => onChange(toggleId(selectedIds, product.id))}
                          className={`overflow-hidden rounded-xl border text-left transition ${
                            checked
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="relative aspect-[4/3] bg-gray-100">
                            {product.primaryImage?.url ? (
                              <img
                                src={product.primaryImage.url}
                                alt={product.primaryImage.altText || product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon className="h-8 w-8" />
                              </div>
                            )}
                            <span
                              className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border ${
                                checked
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-white bg-white/90 text-transparent"
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="space-y-2 p-3">
                            <p className="line-clamp-2 min-h-10 font-semibold text-gray-950">
                              {product.name}
                            </p>
                            <p className="text-sm font-medium text-blue-700">
                              {formatProductPrice(product)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {product.categories.slice(0, 2).map((category) => (
                                <span
                                  key={category.id}
                                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                >
                                  {category.name}
                                </span>
                              ))}
                              {product.categories.length > 2 ? (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                  +{product.categories.length - 2}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-500">
                              {product.variantsSummary.count} biến thể · Tồn {product.variantsSummary.totalStock}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className="min-h-0 overflow-y-auto border-t border-gray-200 bg-gray-50 p-4 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-950">
                    Đã chọn {selectedIds.length}
                  </p>
                  {selectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Xóa hết
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {selectedProducts.length === 0 && missingSelectedIds.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                      Chưa chọn sản phẩm nào.
                    </p>
                  ) : null}
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                        {product.primaryImage?.url ? (
                          <img
                            src={product.primaryImage.url}
                            alt={product.primaryImage.altText || product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                        {product.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeId(product.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Bỏ sản phẩm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {missingSelectedIds.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-sm shadow-sm"
                    >
                      <span className="truncate text-gray-600">{id}</span>
                      <button
                        type="button"
                        onClick={() => removeId(id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Bỏ sản phẩm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function VouchersPage() {
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [memberTierSearch, setMemberTierSearch] = useState("");
  const [scopeOptionsLoading, setScopeOptionsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherUpsertCommand>(createInitialForm());
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(
    null,
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [items, editingId],
  );

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories, categorySearch),
    [categories, categorySearch],
  );

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getVouchers({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      });
      setItems(response.data.items);
    } catch (error) {
      toast.error("Không thể tải danh sách voucher");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setScopeOptionsLoading(true);
        const response = await categoryService.getCategories();
        setCategories(response.data.categories);
      } catch (error) {
        toast.error("Không thể tải danh mục áp dụng voucher");
        console.error(error);
      } finally {
        setScopeOptionsLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        setProductsLoading(true);
        const response = await productService.getProducts({
          page: 1,
          limit: 100,
          search: productSearch.trim() || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        setProducts(response.data.items);
      } catch (error) {
        toast.error("Không thể tải sản phẩm áp dụng voucher");
        console.error(error);
      } finally {
        setProductsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [productSearch]);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setSelectedBannerFile(null);
  };

  const onScopeTypeChange = (scopeType: VoucherScopeType) => {
    setForm((prev) => ({
      ...prev,
      scopeType,
      includedCategoryIds:
        scopeType === "INCLUDE_CATEGORIES" ? prev.includedCategoryIds : [],
      includedProductIds:
        scopeType === "INCLUDE_PRODUCTS" ? prev.includedProductIds : [],
      memberTiers: scopeType === "MEMBER_TIERS" ? prev.memberTiers : [],
    }));
  };

  const onEdit = (item: VoucherItem) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      isBirthdayVoucher: item.isBirthdayVoucher,
      description: item.description,
      type: item.type,
      value: item.value,
      maxDiscount: item.maxDiscount,
      minOrderAmount: item.minOrderAmount,
      maxUsage: item.maxUsage,
      userUsageLimit: item.userUsageLimit,
      startAt: item.startAt,
      endAt: item.endAt,
      isActive: item.isActive,
      bannerImageUrl: item.bannerImageUrl,
      scopeType: item.scopeType,
      includeDescendants: item.includeDescendants,
      minAmountBasis: item.minAmountBasis,
      includedCategoryIds: item.includedCategoryIds,
      excludedCategoryIds: item.excludedCategoryIds,
      includedProductIds: item.includedProductIds,
      excludedProductIds: item.excludedProductIds,
      memberTiers: item.memberTiers,
    });
    setSelectedBannerFile(null);
  };

  const handleBannerFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedBannerFile(file);
  };

  const uploadBannerFromComputer = async () => {
    if (!selectedBannerFile) {
      toast.error("Vui lòng chọn ảnh từ máy trước");
      return;
    }

    try {
      setIsUploadingBanner(true);
      const signatureResponse =
        await cloudinaryService.getSignature("vouchers");
      const imageUrl = await cloudinaryService.uploadImage(
        selectedBannerFile,
        signatureResponse.data,
      );

      setForm((prev) => ({ ...prev, bannerImageUrl: imageUrl }));
      toast.success("Tải ảnh banner thành công");
    } catch (error) {
      toast.error("Không thể tải ảnh banner. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const uploadVoucherBanner = async (
    file: File,
    voucherCode: string,
  ): Promise<string> => {
    const folderSuffix = voucherCode || `${Date.now()}`;
    const signatureResponse = await cloudinaryService.getSignature(
      `vouchers/${folderSuffix}`,
    );
    return cloudinaryService.uploadImage(file, signatureResponse.data);
  };

  const onSubmit = async () => {
    try {
      setSaving(true);

      const normalizedCode = form.code.trim().toUpperCase();
      if (!normalizedCode) {
        toast.error("Vui lòng nhập mã voucher");
        return;
      }

      let bannerImageUrl = form.bannerImageUrl?.trim() || null;

      if (selectedBannerFile && !form.isBirthdayVoucher) {
        toast.info("Đang tải ảnh banner lên Cloudinary...");
        setIsUploadingBanner(true);
        bannerImageUrl = await uploadVoucherBanner(
          selectedBannerFile,
          normalizedCode,
        );
        setForm((prev) => ({ ...prev, bannerImageUrl }));
      }

      if (!editingId && !form.isBirthdayVoucher && !bannerImageUrl) {
        toast.error("Vui lòng tải ảnh banner cho voucher trước khi tạo");
        return;
      }

      const payload: VoucherUpsertCommand = {
        ...form,
        code: normalizedCode,
        description: form.description?.trim() || null,
        bannerImageUrl: form.isBirthdayVoucher ? null : bannerImageUrl,
      };

      if (payload.isBirthdayVoucher) {
        const year = new Date().getFullYear();
        payload.type = "FIXED_AMOUNT";
        payload.maxDiscount = null;
        payload.minOrderAmount = null;
        payload.maxUsage = null;
        payload.userUsageLimit = 1;
        payload.startAt = new Date(year, 0, 1).toISOString();
        payload.endAt = new Date(year, 11, 30, 23, 59, 59, 999).toISOString();
        payload.scopeType = "ALL_PRODUCTS";
        payload.includedCategoryIds = [];
        payload.excludedCategoryIds = [];
        payload.includedProductIds = [];
        payload.excludedProductIds = [];
        payload.memberTiers = [];
      }

      if (payload.type === "FIXED_AMOUNT") {
        payload.maxDiscount = null;
      }

      if (editingId) {
        await voucherService.updateVoucher(editingId, payload);
        toast.success("Cập nhật voucher thành công");
      } else {
        await voucherService.createVoucher(payload);
        toast.success("Tạo voucher thành công");
      }

      resetForm();
      await loadVouchers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể lưu voucher"));
    } finally {
      setIsUploadingBanner(false);
      setSaving(false);
    }
  };

  const toggleStatus = async (item: VoucherItem) => {
    try {
      await voucherService.updateStatus(item.id, !item.isActive);
      toast.success("Cập nhật trạng thái voucher thành công");
      await loadVouchers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái"));
    }
  };

  const onSearch = async () => {
    await loadVouchers();
  };

  const activeCount = items.filter(
    (item) => getVoucherDisplayStatus(item) === "active",
  ).length;
  const expiredCount = items.filter(
    (item) => getVoucherDisplayStatus(item) === "expired",
  ).length;
  const depletedCount = items.filter(
    (item) => getVoucherDisplayStatus(item) === "depleted",
  ).length;
  const totalUsage = items.reduce((sum, item) => sum + item.usedCount, 0);
  const maxUsageTotal = items.reduce(
    (sum, item) => sum + (item.maxUsage ?? item.usedCount),
    0,
  );
  const usageRate = maxUsageTotal
    ? Math.round((totalUsage / maxUsageTotal) * 100)
    : 0;
  const mostUsedVoucher = [...items].sort(
    (a, b) => b.usedCount - a.usedCount,
  )[0];
  const abuseRisk = items.filter(
    (item) => item.userUsageLimit && item.userUsageLimit > 3,
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-375 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfeff,#fff_34%,#f8fafc)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                    Hiệu suất khuyến mãi
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">
                    Bảng hiệu suất khuyến mãi
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Đánh giá hiệu quả voucher theo usage, cost proxy, ROI risk
                    và khả năng abuse trước khi chỉnh form.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <OpsCard>
                <SectionHeading
                  title="Phân tích voucher"
                  description="Tín hiệu business của promotion, không chỉ trạng thái bật/tắt."
                />
                <div className="space-y-4">
                  <MetricBar
                    label="Tỉ lệ sử dụng"
                    value={usageRate}
                    max={100}
                    tone={usageRate > 85 ? "warning" : "info"}
                    detail={`${usageRate}%`}
                  />
                  <MetricBar
                    label="Voucher đang hoạt động"
                    value={activeCount}
                    max={Math.max(items.length, 1)}
                    tone="good"
                    detail={`${activeCount}/${items.length}`}
                  />
                  <MetricBar
                    label="Hết hạn/hết lượt"
                    value={expiredCount + depletedCount}
                    max={Math.max(items.length, 1)}
                    tone="neutral"
                    detail={`${expiredCount + depletedCount}`}
                  />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InsightCard
                    tone="good"
                    priority="Hiệu quả nhất"
                    metric={mostUsedVoucher?.code ?? "—"}
                    title="Voucher hiệu quả nhất theo lượt dùng"
                    description={
                      mostUsedVoucher
                        ? `${mostUsedVoucher.code} có ${mostUsedVoucher.usedCount} lượt dùng. Cần đối chiếu revenue generated và discount cost.`
                        : "Chưa có voucher được dùng."
                    }
                  />
                  <InsightCard
                    tone="warning"
                    priority="Ảnh hưởng lợi nhuận"
                    metric="ROI"
                    title="ROI cần tính cả discount cost"
                    description="Hiện có usage/cap; khi backend trả revenue generated, card sẽ xác định voucher lỗ nhất."
                  />
                </div>
              </OpsCard>

              <OpsCard className="border-amber-200 bg-gradient-to-br from-white to-amber-50">
                <SectionHeading
                  title="Điểm nổi bật thông minh"
                  description="Các promotion cần review trước khi chạy campaign."
                />
                <div className="grid gap-3">
                  <AlertItem
                    tone={depletedCount > 0 ? "warning" : "good"}
                    icon={BadgePercent}
                    title={`${depletedCount} voucher hết lượt`}
                    description="Voucher depleted cần tắt hoặc mở rộng quota có kiểm soát."
                    action="Xem danh sách"
                  />
                  <AlertItem
                    tone={abuseRisk > 0 ? "danger" : "info"}
                    icon={ShieldAlert}
                    title={`${abuseRisk} voucher có rủi ro lạm dụng`}
                    description="User usage limit cao có thể làm xấu profit nếu không gắn segment."
                    action="Review giới hạn"
                  />
                  <AlertItem
                    tone="info"
                    icon={TrendingUp}
                    title="Doanh thu tạo ra cần xem sâu"
                    description="Liên kết voucher với đơn hàng giúp admin biết tăng doanh thu thật hay chỉ tăng giảm giá."
                    action="Nối với đơn hàng"
                  />
                  <AlertItem
                    tone="warning"
                    icon={PiggyBank}
                    title="Ảnh hưởng lợi nhuận chưa là chỉ số chính"
                    description="Nên bổ sung doanh thu ròng/hiệu quả đầu tư khuyến mãi từ backend để ra quyết định ngân sách."
                    action="Đánh dấu việc cần làm"
                  />
                </div>
              </OpsCard>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem
                  ? `Chỉnh sửa voucher ${editingItem.code}`
                  : "Tạo voucher"}
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm text-gray-700">
                  Mã voucher
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    placeholder="WELCOME10"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Loại
                  <select
                    value={form.isBirthdayVoucher ? "BIRTHDAY" : form.type}
                    onChange={(e) => {
                      const isBirthdayVoucher = e.target.value === "BIRTHDAY";
                      setForm((prev) => ({
                        ...prev,
                        isBirthdayVoucher,
                        type: isBirthdayVoucher
                          ? "FIXED_AMOUNT"
                          : (e.target.value as VoucherType),
                        bannerImageUrl: isBirthdayVoucher
                          ? null
                          : prev.bannerImageUrl,
                      }));
                      if (isBirthdayVoucher) setSelectedBannerFile(null);
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                    <option value="BIRTHDAY">Sinh nhật</option>
                  </select>
                </label>

                {form.isBirthdayVoucher ? (
                  <label className="block text-sm text-gray-700">
                    Giá trị giảm
                    <input
                      type="number"
                      min={1}
                      value={form.value}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          value: Number(e.target.value),
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    />
                  </label>
                ) : null}

                {form.isBirthdayVoucher ? (
                  <p className="self-end rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700">
                    Mỗi tài khoản dùng 1 lần · Hiệu lực 01/01–30/12 năm hiện tại
                  </p>
                ) : null}

                {!form.isBirthdayVoucher ? (
                  <>

                <label className="block text-sm text-gray-700">
                  Phạm vi áp dụng
                  <select
                    value={form.scopeType}
                    onChange={(event) =>
                      onScopeTypeChange(event.target.value as VoucherScopeType)
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  >
                    <option value="ALL_PRODUCTS">Tất cả sản phẩm</option>
                    <option value="INCLUDE_CATEGORIES">Danh mục được chọn</option>
                    <option value="INCLUDE_PRODUCTS">Sản phẩm được chọn</option>
                    <option value="MEMBER_TIERS">Hạng thành viên</option>
                  </select>
                </label>
                <label className="block text-sm text-gray-700">
                  Điều kiện đơn tối thiểu
                  <select
                    value={form.minAmountBasis}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        minAmountBasis: event.target.value as
                          | "ELIGIBLE_SUBTOTAL"
                          | "CART_SUBTOTAL",
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  >
                    <option value="ELIGIBLE_SUBTOTAL">
                      Tổng sản phẩm đủ điều kiện
                    </option>
                    <option value="CART_SUBTOTAL">Tổng toàn giỏ</option>
                  </select>
                </label>
                {form.scopeType === "INCLUDE_CATEGORIES" ? (
                  <>
                    <MultiSelectPicker
                      label="Danh mục áp dụng"
                      placeholder="Tìm danh mục theo tên hoặc slug"
                      options={categoryOptions}
                      selectedIds={form.includedCategoryIds ?? []}
                      search={categorySearch}
                      loading={scopeOptionsLoading}
                      emptyText="Không tìm thấy danh mục phù hợp"
                      onSearchChange={setCategorySearch}
                      onChange={(ids) =>
                        setForm((prev) => ({
                          ...prev,
                          includedCategoryIds: ids,
                        }))
                      }
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.includeDescendants}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            includeDescendants: event.target.checked,
                          }))
                        }
                      />
                      Bao gồm danh mục con
                    </label>
                  </>
                ) : null}
                {form.scopeType === "INCLUDE_PRODUCTS" ? (
                  <ProductSelectField
                    label="Sản phẩm áp dụng"
                    placeholder="Tìm sản phẩm theo tên hoặc SKU"
                    products={products}
                    selectedIds={form.includedProductIds ?? []}
                    search={productSearch}
                    loading={productsLoading}
                    onSearchChange={setProductSearch}
                    onChange={(ids) =>
                      setForm((prev) => ({
                        ...prev,
                        includedProductIds: ids,
                      }))
                    }
                  />
                ) : null}
                {form.scopeType === "MEMBER_TIERS" ? (
                  <MultiSelectPicker
                    label="Hạng thành viên áp dụng"
                    placeholder="Tìm MEMBER, SILVER hoặc GOLD"
                    options={[
                      {
                        id: "MEMBER",
                        label: "MEMBER",
                        description: "Khách hàng thành viên cơ bản",
                      },
                      {
                        id: "SILVER",
                        label: "SILVER",
                        description: "Khách hàng hạng bạc",
                      },
                      {
                        id: "GOLD",
                        label: "GOLD",
                        description: "Khách hàng hạng vàng",
                      },
                    ].filter((option) =>
                      option.label
                        .toLowerCase()
                        .includes(memberTierSearch.trim().toLowerCase()),
                    )}
                    selectedIds={form.memberTiers ?? []}
                    search={memberTierSearch}
                    emptyText="Không tìm thấy hạng thành viên phù hợp"
                    onSearchChange={setMemberTierSearch}
                    onChange={(ids) =>
                      setForm((prev) => ({ ...prev, memberTiers: ids }))
                    }
                  />
                ) : null}
                <ProductSelectField
                  label="Loại trừ sản phẩm"
                  placeholder="Tìm sản phẩm cần loại trừ"
                  products={products}
                  selectedIds={form.excludedProductIds ?? []}
                  search={productSearch}
                  loading={productsLoading}
                  onSearchChange={setProductSearch}
                  onChange={(ids) =>
                    setForm((prev) => ({ ...prev, excludedProductIds: ids }))
                  }
                />
                <MultiSelectPicker
                  label="Loại trừ danh mục"
                  placeholder="Tìm danh mục cần loại trừ"
                  options={categoryOptions}
                  selectedIds={form.excludedCategoryIds ?? []}
                  search={categorySearch}
                  loading={scopeOptionsLoading}
                  emptyText="Không tìm thấy danh mục phù hợp"
                  onSearchChange={setCategorySearch}
                  onChange={(ids) =>
                    setForm((prev) => ({ ...prev, excludedCategoryIds: ids }))
                  }
                />

                <label className="block text-sm text-gray-700">
                  Giá trị
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        value: Number(e.target.value),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Giảm tối đa
                  <input
                    type="number"
                    value={form.maxDiscount ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxDiscount: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Đơn tối thiểu
                  <input
                    type="number"
                    value={form.minOrderAmount ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        minOrderAmount: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Lượt dùng tối đa
                  <input
                    type="number"
                    value={form.maxUsage ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxUsage: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Giới hạn mỗi người dùng
                  <input
                    type="number"
                    value={form.userUsageLimit ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        userUsageLimit: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Bắt đầu
                  <input
                    type="datetime-local"
                    value={toDateTimeLocalValue(form.startAt)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startAt: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Kết thúc
                  <input
                    type="datetime-local"
                    value={toDateTimeLocalValue(form.endAt)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        endAt: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700 md:col-span-2">
                  URL ảnh banner
                  <input
                    value={form.bannerImageUrl ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bannerImageUrl: e.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    placeholder="https://..."
                  />
                </label>

                <div className="md:col-span-1">
                  <label className="block text-sm text-gray-700">
                    Ảnh banner từ máy
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <button
                    type="button"
                    onClick={uploadBannerFromComputer}
                    disabled={!selectedBannerFile || isUploadingBanner}
                    className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingBanner ? "Đang tải ảnh..." : "Tải ảnh từ máy"}
                  </button>
                </div>

                {form.bannerImageUrl ? (
                  <div className="md:col-span-3">
                    <p className="mb-2 text-sm text-gray-700">
                      Xem trước banner
                    </p>
                    <img
                      src={form.bannerImageUrl}
                      alt="Xem trước banner voucher"
                      className="h-28 w-full max-w-xl rounded-lg border border-gray-200 object-cover"
                    />
                  </div>
                ) : null}

                <label className="block text-sm text-gray-700 md:col-span-3">
                  Mô tả
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="mt-1 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                  </>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={onSubmit}
                  disabled={saving || isUploadingBanner}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId
                      ? "Cập nhật voucher"
                      : "Tạo voucher"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-gray-300 px-3"
                  placeholder="Tìm theo mã hoặc mô tả voucher"
                />
                <button
                  onClick={onSearch}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-220 text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Mã</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Giá trị</th>
                      <th className="px-3 py-2">Lượt dùng</th>
                      <th className="px-3 py-2">Thời gian áp dụng</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="px-3 py-4" colSpan={7}>
                          Đang tải danh sách voucher...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4" colSpan={7}>
                          Không tìm thấy voucher.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const displayStatus = getVoucherDisplayStatus(item);
                        const statusBadge =
                          getVoucherStatusBadge(displayStatus);

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {item.code}
                            </td>
                            <td className="px-3 py-2">
                              {formatVoucherTypeLabel(
                                item.type,
                                item.isBirthdayVoucher,
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {item.type === "PERCENTAGE"
                                ? `${item.value}%`
                                : `${item.value.toLocaleString("vi-VN")} đ`}
                            </td>
                            <td className="px-3 py-2">
                              {item.usedCount}/{item.maxUsage ?? "∞"}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {new Date(item.startAt).toLocaleString()} -{" "}
                              {new Date(item.endAt).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge.className}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 space-x-2">
                              <button
                                onClick={() => onEdit(item)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-gray-700"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => toggleStatus(item)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-gray-700"
                              >
                                {item.isActive ? "Tắt" : "Bật"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
