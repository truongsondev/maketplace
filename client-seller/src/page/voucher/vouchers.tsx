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
import { cloudinaryService, voucherService } from "@/services/api";
import type {
  VoucherItem,
  VoucherType,
  VoucherUpsertCommand,
} from "@/types/api";
import { BadgePercent, PiggyBank, ShieldAlert, TrendingUp } from "lucide-react";

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

function formatVoucherTypeLabel(type: VoucherType): string {
  if (type === "PERCENTAGE") {
    return "Phần trăm";
  }

  return "Số tiền cố định";
}

export default function VouchersPage() {
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setSelectedBannerFile(null);
  };

  const onEdit = (item: VoucherItem) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
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

      if (selectedBannerFile) {
        toast.info("Đang tải ảnh banner lên Cloudinary...");
        setIsUploadingBanner(true);
        bannerImageUrl = await uploadVoucherBanner(
          selectedBannerFile,
          normalizedCode,
        );
        setForm((prev) => ({ ...prev, bannerImageUrl }));
      }

      if (!editingId && !bannerImageUrl) {
        toast.error("Vui lòng tải ảnh banner cho voucher trước khi tạo");
        return;
      }

      const payload: VoucherUpsertCommand = {
        ...form,
        code: normalizedCode,
        description: form.description?.trim() || null,
        bannerImageUrl,
      };

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
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as VoucherType,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                  </select>
                </label>

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
                              {formatVoucherTypeLabel(item.type)}
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
