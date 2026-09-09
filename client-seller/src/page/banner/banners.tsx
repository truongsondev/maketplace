import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertItem,
  Header,
  MetricBar,
  OpsCard,
  Sidebar,
} from "@/components/admin";
import { bannerService, cloudinaryService } from "@/services/api";
import type { BannerItem, BannerUpsertCommand } from "@/types/api";
import {
  CalendarClock,
  Eye,
  TrendingUp,
} from "lucide-react";

function createInitialForm(): BannerUpsertCommand {
  return {
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    isActive: false,
    sortOrder: 0,
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

export default function BannersPage() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerUpsertCommand>(createInitialForm());
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(
    null,
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [items, editingId],
  );

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getBanners({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      });
      setItems(response.data.items);
    } catch (error) {
      toast.error("Không tải được danh sách banner");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setSelectedBannerFile(null);
  };

  const onEdit = (item: BannerItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
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
      const folder = `banners/${Date.now()}`;
      const signatureResponse = await bannerService.getUploadSignature(folder);
      const imageUrl = await cloudinaryService.uploadImage(
        selectedBannerFile,
        signatureResponse.data,
      );

      setForm((prev) => ({ ...prev, imageUrl }));
      toast.success("Tải ảnh banner thành công");
    } catch (error) {
      toast.error("Không thể tải ảnh banner. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const onSubmit = async () => {
    try {
      setSaving(true);

      let imageUrl = form.imageUrl.trim();
      if (selectedBannerFile) {
        toast.info("Đang tải ảnh banner lên Cloudinary...");
        setIsUploadingBanner(true);
        const folderSlug =
          form.title
            ?.toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || `${Date.now()}`;

        const signatureResponse = await bannerService.getUploadSignature(
          `banners/${folderSlug}`,
        );
        imageUrl = await cloudinaryService.uploadImage(
          selectedBannerFile,
          signatureResponse.data,
        );
      }

      if (!imageUrl) {
        toast.error("Vui lòng tải ảnh banner trước khi lưu");
        return;
      }

      const payload: BannerUpsertCommand = {
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || null,
        description: form.description?.trim() || null,
        imageUrl,
        isActive: form.isActive ?? false,
        sortOrder: Number(form.sortOrder ?? 0),
      };

      if (!payload.title) {
        toast.error("Tiêu đề là bắt buộc");
        return;
      }

      if (editingId) {
        await bannerService.updateBanner(editingId, payload);
        toast.success("Cập nhật banner thành công");
      } else {
        await bannerService.createBanner(payload);
        toast.success("Tạo banner thành công");
      }

      resetForm();
      await loadBanners();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lưu banner thất bại"));
    } finally {
      setIsUploadingBanner(false);
      setSaving(false);
    }
  };

  const toggleStatus = async (item: BannerItem) => {
    try {
      await bannerService.updateStatus(item.id, !item.isActive);
      toast.success("Đã cập nhật trạng thái banner");
      await loadBanners();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại"));
    }
  };

  const onSearch = async () => {
    await loadBanners();
  };

  const activeCount = items.filter((item) => item.isActive).length;
  const inactiveCount = items.length - activeCount;
  const ctrProxy = Math.min(12, Math.max(2, activeCount * 1.7));
  const conversionProxy = Math.max(0.4, ctrProxy / 3.6);

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
                    Hiệu suất biểu ngữ
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">
                    Hiệu suất biểu ngữ
                  </h1>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <OpsCard>
                <div className="space-y-4">
                  <MetricBar
                    label="Biểu ngữ đang bật"
                    value={activeCount}
                    max={Math.max(items.length, 1)}
                    tone="good"
                    detail={`${activeCount}/${items.length}`}
                  />
                  <MetricBar
                    label="Ước tính tỉ lệ nhấp"
                    value={ctrProxy}
                    max={12}
                    tone="info"
                    detail={`${ctrProxy.toFixed(1)}%`}
                  />
                  <MetricBar
                    label="Ước tính chuyển đổi"
                    value={conversionProxy}
                    max={4}
                    tone="warning"
                    detail={`${conversionProxy.toFixed(1)}%`}
                  />
                </div>
              </OpsCard>

              <OpsCard className="border-cyan-200 bg-linear-to-br from-white to-cyan-50">
                <div className="grid gap-3 md:grid-cols-2">
                  <AlertItem
                    tone="good"
                    icon={Eye}
                    title={`${activeCount} biểu ngữ đang hiển thị`}
                    description="Biểu ngữ đang chạy cần xem trước đúng trạng thái máy tính/di động."
                    action="Xem trước"
                  />
                  <AlertItem
                    tone={inactiveCount > 0 ? "warning" : "info"}
                    icon={CalendarClock}
                    title={`${inactiveCount} banner tạm tắt`}
                    description="Nên có scheduling để tránh bật/tắt thủ công."
                    action="Review lịch chạy"
                  />
                  <AlertItem
                    tone="warning"
                    icon={TrendingUp}
                    title="Đóng góp doanh thu"
                    description="Biểu ngữ phải nối được tới đơn hàng để thấy doanh thu đóng góp."
                    action="Xem sâu đơn hàng"
                  />
                </div>
              </OpsCard>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem
                  ? `Sửa banner: ${editingItem.title}`
                  : "Tạo banner"}
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm text-gray-700">
                  Tiêu đề
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    placeholder="Ví dụ: Bộ sưu tập mùa hè"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Phụ đề
                  <input
                    value={form.subtitle ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    placeholder="Mới nhất"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Thứ tự hiển thị
                  <input
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: Number(e.target.value || 0),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>

                <label className="block text-sm text-gray-700 md:col-span-2">
                  URL ảnh banner
                  <input
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                    placeholder="https://..."
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="size-4"
                  />
                  Hiển thị trên trang chủ người mua
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

                {form.imageUrl ? (
                  <div className="md:col-span-3">
                    <p className="mb-2 text-sm text-gray-700">
                      Xem trước banner
                    </p>
                    <img
                      src={form.imageUrl}
                      alt="Xem trước banner"
                      className="h-32 w-full max-w-2xl rounded-lg border border-gray-200 object-cover"
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
                      ? "Cập nhật banner"
                      : "Tạo banner"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                  >
                    Huỷ sửa
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
                  placeholder="Tìm theo tiêu đề/phụ đề"
                />
                <button
                  onClick={onSearch}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                >
                  Tìm
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-220 text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Tiêu đề</th>
                      <th className="px-3 py-2">Ảnh</th>
                      <th className="px-3 py-2">Thứ tự</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="px-3 py-4" colSpan={5}>
                          Đang tải banner...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4" colSpan={5}>
                          Không tìm thấy banner.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <p className="font-semibold text-gray-900">
                              {item.title}
                            </p>
                            {item.subtitle ? (
                              <p className="text-xs text-gray-500">
                                {item.subtitle}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-12 w-24 rounded border border-gray-200 object-cover"
                            />
                          </td>
                          <td className="px-3 py-2">{item.sortOrder}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                item.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.isActive ? "Đang bật" : "Tạm tắt"}
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
                      ))
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
