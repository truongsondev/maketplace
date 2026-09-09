import { useEffect, useMemo, useState } from "react";
import { Header, Sidebar } from "@/components/admin";
import { categoryService, cloudinaryService, productService, promotionService } from "@/services/api";
import type {
  Category,
  ProductListItem,
  PromotionItem,
  PromotionStatus,
  PromotionUpsertCommand,
} from "@/types/api";
import { toast } from "sonner";
import { Check, ImageIcon, Search, X } from "lucide-react";

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialForm(): PromotionUpsertCommand {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    name: "",
    title: "",
    subtitle: "",
    description: "",
    bannerImageUrl: "",
    mobileBannerImageUrl: "",
    campaignType: "CUSTOM",
    type: "PERCENTAGE",
    status: "DRAFT",
    scopeType: "ALL_PRODUCTS",
    includeDescendants: false,
    value: 10,
    maxDiscount: 20000,
    priority: 0,
    displayPriority: 0,
    isFeatured: false,
    ctaLabel: "Xem ưu đãi",
    ctaUrl: "",
    usageLimit: null,
    stackableWithVoucher: true,
    startAt: now.toISOString(),
    endAt: end.toISOString(),
    includedProductIds: [],
    includedCategoryIds: [],
  };
}

function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <label className="block text-sm text-gray-700 md:col-span-2">
      {label}
      <select
        multiple
        value={selectedIds}
        onChange={(event) =>
          onChange(Array.from(event.target.selectedOptions, (option) => option.value))
        }
        className="mt-1 h-36 w-full rounded-lg border border-gray-300 px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatProductPrice(product: ProductListItem): string {
  const { min, max } = product.variantsSummary.priceRange;
  if (min === max) return `${min.toLocaleString("vi-VN")} đ`;
  return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} đ`;
}

function ProductSelectModal({ products, selectedIds, onChange }: {
  products: ProductListItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProducts = selectedIds.map((id) => productById.get(id)).filter(Boolean) as ProductListItem[];
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase("vi").includes(keyword) ||
      product.categories.some((category) => category.name.toLocaleLowerCase("vi").includes(keyword)),
    );
  }, [products, search]);
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);

  return <div className="space-y-2 text-sm text-gray-700 md:col-span-2">
    <div className="flex items-center justify-between"><span>Sản phẩm áp dụng</span>{selectedIds.length > 0 ? <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-blue-600">Bỏ chọn tất cả</button> : null}</div>
    <button type="button" onClick={() => setIsOpen(true)} className="flex min-h-12 w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left hover:border-blue-400 hover:bg-blue-50/40">
      <span className={selectedIds.length ? "font-medium text-gray-900" : "text-gray-400"}>{selectedIds.length ? `Đã chọn ${selectedIds.length} sản phẩm` : "Chưa chọn sản phẩm nào"}</span>
      <span className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Mở danh sách</span>
    </button>
    {selectedProducts.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{selectedProducts.slice(0, 4).map((product) => <div key={product.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">{product.primaryImage?.url ? <img src={product.primaryImage.url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-400" /></div>}</div>
      <div className="min-w-0 flex-1"><p className="truncate font-medium text-gray-950">{product.name}</p><p className="text-xs text-gray-500">{formatProductPrice(product)}</p></div>
      <button type="button" onClick={() => toggle(product.id)} title="Bỏ sản phẩm" className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
    </div>)}</div> : null}
    {isOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4"><div><h2 className="text-xl font-bold text-gray-950">Chọn sản phẩm áp dụng</h2><p className="mt-1 text-sm text-gray-500">Chọn theo ảnh, tên, giá, danh mục và tồn kho.</p></div><button type="button" onClick={() => setIsOpen(false)} title="Đóng" className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
        <div className="border-b px-5 py-3"><div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3"><Search className="h-4 w-4 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full outline-none" placeholder="Tìm theo tên hoặc danh mục..." /></div></div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
          <div className="min-h-0 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => { const checked = selectedIds.includes(product.id); return <button key={product.id} type="button" onClick={() => toggle(product.id)} className={`overflow-hidden rounded-xl border text-left transition ${checked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
            <div className="relative aspect-[4/3] bg-gray-100">{product.primaryImage?.url ? <img src={product.primaryImage.url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-400" /></div>}<span className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-white bg-white/90 text-transparent"}`}><Check className="h-4 w-4" /></span></div>
            <div className="space-y-2 p-3"><p className="line-clamp-2 min-h-10 font-semibold text-gray-950">{product.name}</p><p className="font-medium text-blue-700">{formatProductPrice(product)}</p><div className="flex flex-wrap gap-1">{product.categories.slice(0, 2).map((category) => <span key={category.id} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{category.name}</span>)}</div><p className="text-xs text-gray-500">{product.variantsSummary.count} biến thể · Tồn {product.variantsSummary.totalStock}</p></div>
          </button>; })}</div>{filteredProducts.length === 0 ? <p className="py-10 text-center text-gray-500">Không tìm thấy sản phẩm phù hợp.</p> : null}</div>
          <aside className="min-h-0 overflow-y-auto border-t bg-gray-50 p-4 lg:border-l lg:border-t-0"><div className="flex items-center justify-between"><p className="font-semibold">Đã chọn {selectedIds.length}</p>{selectedIds.length ? <button type="button" onClick={() => onChange([])} className="text-xs text-blue-600">Xóa hết</button> : null}</div><div className="mt-3 space-y-2">{selectedProducts.map((product) => <div key={product.id} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm"><div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">{product.primaryImage?.url ? <img src={product.primaryImage.url} alt={product.name} className="h-full w-full object-cover" /> : null}</div><p className="min-w-0 flex-1 truncate font-medium">{product.name}</p><button type="button" onClick={() => toggle(product.id)} title="Bỏ sản phẩm"><X className="h-4 w-4" /></button></div>)}</div></aside>
        </div>
        <div className="flex justify-end border-t px-5 py-4"><button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white">Xong ({selectedIds.length})</button></div>
      </div>
    </div> : null}
  </div>;
}

function CampaignImageField({ label, hint, file, imageUrl, onFileChange }: {
  label: string;
  hint: string;
  file: File | null;
  imageUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : imageUrl || "", [file, imageUrl]);
  useEffect(() => () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); }, [file, previewUrl]);
  return <div className="space-y-2 rounded-lg border border-gray-200 p-3 md:col-span-1">
    <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-500">{hint}</p></div>
    <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm font-medium text-gray-600 hover:border-blue-400 hover:bg-blue-50">
      <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
      {file ? "Đổi ảnh đã chọn" : imageUrl ? "Chọn ảnh thay thế" : "Chọn ảnh từ máy"}
    </label>
    {file ? <div className="flex items-center justify-between gap-2 text-xs text-gray-600"><span className="truncate">{file.name}</span><button type="button" onClick={() => onFileChange(null)} className="font-medium text-red-600">Bỏ chọn</button></div> : null}
    {previewUrl ? <img src={previewUrl} alt={`Xem trước ${label}`} className="h-28 w-full rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-28 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><ImageIcon className="h-7 w-7" /></div>}
  </div>;
}

export default function PromotionsPage() {
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionUpsertCommand>(initialForm());
  const [saving, setSaving] = useState(false);
  const [desktopBannerFile, setDesktopBannerFile] = useState<File | null>(null);
  const [mobileBannerFile, setMobileBannerFile] = useState<File | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.name })),
    [categories],
  );
  const load = async () => {
    try {
      const [promotionRes, categoryRes, productRes] = await Promise.all([
        promotionService.list(),
        categoryService.getCategories(),
        productService.getProducts({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      setItems(promotionRes.data.items);
      setCategories(categoryRes.data.categories);
      setProducts(productRes.data.items);
    } catch (error) {
      toast.error("Không thể tải dữ liệu promotion");
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const edit = (item: PromotionItem) => {
    setDesktopBannerFile(null);
    setMobileBannerFile(null);
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      bannerImageUrl: item.bannerImageUrl,
      mobileBannerImageUrl: item.mobileBannerImageUrl,
      campaignType: item.campaignType,
      type: item.type,
      status: item.status,
      scopeType: item.scopeType,
      includeDescendants: item.includeDescendants,
      value: Number(item.value),
      maxDiscount: item.maxDiscount === null ? null : Number(item.maxDiscount),
      priority: item.priority,
      displayPriority: item.displayPriority,
      isFeatured: item.isFeatured,
      ctaLabel: item.ctaLabel,
      ctaUrl: item.ctaUrl,
      memberTiers: item.memberTiers ?? [],
      usageLimit: item.usageLimit,
      stackableWithVoucher: item.stackableWithVoucher,
      startAt: item.startAt,
      endAt: item.endAt,
      includedProductIds: item.includedProducts.map((row) => row.productId),
      includedCategoryIds: item.includedCategories.map((row) => row.categoryId),
    });
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch");
      return;
    }
    try {
      setSaving(true);
      const folderSlug = form.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `${Date.now()}`;
      let bannerImageUrl = form.bannerImageUrl?.trim() || null;
      let mobileBannerImageUrl = form.mobileBannerImageUrl?.trim() || null;
      if (desktopBannerFile || mobileBannerFile) {
        toast.info("Đang tải ảnh chiến dịch lên Cloudinary...");
        const uploads = await Promise.all([
          desktopBannerFile ? cloudinaryService.getSignature(`promotions/${folderSlug}/desktop`).then((signature) => cloudinaryService.uploadImage(desktopBannerFile, signature.data)) : Promise.resolve(bannerImageUrl),
          mobileBannerFile ? cloudinaryService.getSignature(`promotions/${folderSlug}/mobile`).then((signature) => cloudinaryService.uploadImage(mobileBannerFile, signature.data)) : Promise.resolve(mobileBannerImageUrl),
        ]);
        [bannerImageUrl, mobileBannerImageUrl] = uploads;
      }
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        bannerImageUrl,
        mobileBannerImageUrl,
      };
      if (editingId) {
        await promotionService.update(editingId, payload);
        toast.success("Đã cập nhật promotion");
      } else {
        await promotionService.create(payload);
        toast.success("Đã tạo promotion");
      }
      setEditingId(null);
      setForm(initialForm());
      setDesktopBannerFile(null);
      setMobileBannerFile(null);
      await load();
    } catch (error) {
      toast.error("Không thể lưu promotion");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: PromotionStatus) => {
    try {
      await promotionService.setStatus(id, status);
      await load();
    } catch (error) {
      toast.error("Không thể đổi trạng thái promotion");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h1 className="text-2xl font-bold text-gray-950">
                Chiến dịch khuyến mãi
              </h1>
              <div className="mt-6 space-y-7">
                <div>
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Thông tin chiến dịch</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">Tên chiến dịch (quản trị)<input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Ví dụ: Flash Sale tuần 29" /></label>
                    <label className="text-sm font-medium text-gray-700">Tiêu đề hiển thị<input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Giờ vàng săn sale" /></label>
                    <label className="text-sm font-medium text-gray-700">Mô tả ngắn<input value={form.subtitle ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Giảm đến 30%" /></label>
                    <label className="text-sm font-medium text-gray-700">Loại chiến dịch<select value={form.campaignType} onChange={(event) => setForm((prev) => ({ ...prev, campaignType: event.target.value as PromotionUpsertCommand["campaignType"] }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3"><option value="FLASH_SALE">Flash sale</option><option value="HOLIDAY">Ngày lễ</option><option value="CUSTOMER_APPRECIATION">Tri ân khách hàng</option><option value="SEASONAL">Theo mùa</option><option value="CUSTOM">Tùy chỉnh</option></select></label>
                    <label className="text-sm font-medium text-gray-700">Trạng thái<select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PromotionStatus }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3"><option value="DRAFT">Bản nháp</option><option value="SCHEDULED">Đã lên lịch</option><option value="ACTIVE">Đang chạy</option><option value="PAUSED">Tạm dừng</option><option value="ENDED">Đã kết thúc</option></select></label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Hình ảnh chiến dịch</h2>
                  <div className="mt-3 grid items-start gap-4 md:grid-cols-2"><CampaignImageField label="Banner desktop" hint="Khuyến nghị ảnh ngang 16:6" file={desktopBannerFile} imageUrl={form.bannerImageUrl} onFileChange={setDesktopBannerFile} /><CampaignImageField label="Banner mobile" hint="Khuyến nghị ảnh dọc 4:5" file={mobileBannerFile} imageUrl={form.mobileBannerImageUrl} onFileChange={setMobileBannerFile} /></div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Nút điều hướng</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">Nội dung nút<input value={form.ctaLabel ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Xem ưu đãi" /></label>
                    <label className="text-sm font-medium text-gray-700">Đường dẫn khi bấm nút<input value={form.ctaUrl ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, ctaUrl: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Để trống để mở trang chiến dịch" /></label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Điều kiện và mức giảm</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">Loại giảm giá<select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as PromotionUpsertCommand["type"] }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3"><option value="PERCENTAGE">Giảm phần trăm</option><option value="FIXED_AMOUNT">Giảm số tiền</option><option value="SALE_PRICE">Giá sale</option></select></label>
                    <label className="text-sm font-medium text-gray-700">Phạm vi áp dụng<select value={form.scopeType} onChange={(event) => setForm((prev) => ({ ...prev, scopeType: event.target.value as PromotionUpsertCommand["scopeType"] }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3"><option value="ALL_PRODUCTS">Tất cả sản phẩm</option><option value="INCLUDE_CATEGORIES">Danh mục được chọn</option><option value="INCLUDE_PRODUCTS">Sản phẩm được chọn</option></select></label>
                    <label className="text-sm font-medium text-gray-700">Giá trị giảm<input type="number" value={form.value} onChange={(event) => setForm((prev) => ({ ...prev, value: Number(event.target.value) }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                    <label className="text-sm font-medium text-gray-700">Giảm tối đa<input type="number" value={form.maxDiscount ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, maxDiscount: event.target.value ? Number(event.target.value) : null }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Không giới hạn" /></label>
                    <label className="text-sm font-medium text-gray-700">Ưu tiên áp dụng<input type="number" value={form.priority ?? 0} onChange={(event) => setForm((prev) => ({ ...prev, priority: Number(event.target.value) }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                    <label className="text-sm font-medium text-gray-700">Ưu tiên hiển thị<input type="number" value={form.displayPriority ?? 0} onChange={(event) => setForm((prev) => ({ ...prev, displayPriority: Number(event.target.value) }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Lịch chạy và tùy chọn</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">Bắt đầu<input type="datetime-local" value={toDateTimeLocalValue(form.startAt)} onChange={(event) => setForm((prev) => ({ ...prev, startAt: new Date(event.target.value).toISOString() }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                    <label className="text-sm font-medium text-gray-700">Kết thúc<input type="datetime-local" value={toDateTimeLocalValue(form.endAt)} onChange={(event) => setForm((prev) => ({ ...prev, endAt: new Date(event.target.value).toISOString() }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-gray-50 px-4 py-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isFeatured ?? false} onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))} /> Hiển thị trên trang chủ</label>
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.stackableWithVoucher} onChange={(event) => setForm((prev) => ({ ...prev, stackableWithVoucher: event.target.checked }))} /> Cho phép cộng thêm voucher</label>
                  </div>
                </div>

                {form.scopeType !== "ALL_PRODUCTS" ? <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">Đối tượng áp dụng</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {form.scopeType === "INCLUDE_PRODUCTS" ? (
                  <ProductSelectModal
                    products={products}
                    selectedIds={form.includedProductIds ?? []}
                    onChange={(ids) => setForm((prev) => ({ ...prev, includedProductIds: ids }))}
                  />
                ) : null}
                {form.scopeType === "INCLUDE_CATEGORIES" ? (
                  <>
                    <MultiSelect
                      label="Danh mục áp dụng"
                      options={categoryOptions}
                      selectedIds={form.includedCategoryIds ?? []}
                      onChange={(ids) => setForm((prev) => ({ ...prev, includedCategoryIds: ids }))}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.includeDescendants}
                        onChange={(event) => setForm((prev) => ({ ...prev, includeDescendants: event.target.checked }))}
                      />
                      Bao gồm danh mục con
                    </label>
                  </>
                ) : null}
                  </div>
                </div> : null}
              </div>
              <label className="mt-6 block border-t border-gray-200 pt-6 text-sm font-medium text-gray-700">Mô tả chi tiết<textarea value={form.description ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className="mt-1.5 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Nội dung giới thiệu và điều kiện của chương trình" /></label>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo promotion"}
                </button>
                {editingId ? (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setForm(initialForm());
                      setDesktopBannerFile(null);
                      setMobileBannerFile(null);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                  >
                    Hủy sửa
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-950">
                Danh sách chiến dịch
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Tên</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Campaign</th>
                      <th className="px-3 py-2">Giá trị</th>
                      <th className="px-3 py-2">Thời gian</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Lượt dùng</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-3 py-2">{item.type}</td>
                        <td className="px-3 py-2">{item.campaignType}</td>
                        <td className="px-3 py-2">{Number(item.value).toLocaleString("vi-VN")}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {new Date(item.startAt).toLocaleString("vi-VN")} - {new Date(item.endAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2">{item.status}</td>
                        <td className="px-3 py-2">{item.usedCount}/{item.usageLimit ?? "∞"}</td>
                        <td className="space-x-2 px-3 py-2">
                          <button onClick={() => edit(item)} className="rounded border px-2 py-1">
                            Sửa
                          </button>
                          <button
                            onClick={() => setStatus(item.id, item.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                            className="rounded border px-2 py-1"
                          >
                            {item.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
