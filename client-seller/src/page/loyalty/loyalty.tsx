import { useEffect, useState } from "react";
import { Header, Sidebar } from "@/components/admin";
import { loyaltyAdminService } from "@/services/api";
import type { LoyaltyConfig } from "@/types/api";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Medal,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";

const defaultConfig: LoyaltyConfig = {
  id: 1,
  spendPerPoint: 10000,
  pointValidityDays: 365,
  silverMinPoints: 1000,
  goldMinPoints: 5000,
  isActive: true,
  updatedAt: new Date().toISOString(),
};

export default function LoyaltyPage() {
  const [config, setConfig] = useState<LoyaltyConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  const loadConfig = async () => {
    try {
      const response = await loyaltyAdminService.getConfig();
      setConfig(response.data);
    } catch (error) {
      toast.error("Không thể tải cấu hình loyalty");
      console.error(error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await loyaltyAdminService.updateConfig(config);
      setConfig(response.data);
      toast.success("Đã cập nhật cấu hình loyalty");
    } catch (error) {
      toast.error("Không thể lưu cấu hình loyalty");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const adjust = async () => {
    if (!adjustUserId.trim() || !adjustReason.trim() || adjustPoints === 0) {
      toast.error("Vui lòng nhập userId, số điểm và lý do");
      return;
    }
    try {
      const response = await loyaltyAdminService.adjust({
        userId: adjustUserId.trim(),
        points: adjustPoints,
        reason: adjustReason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success(`Đã điều chỉnh ${response.data.changed} điểm`);
      setAdjustPoints(0);
      setAdjustReason("");
    } catch (error) {
      toast.error("Không thể điều chỉnh điểm");
      console.error(error);
    }
  };

  const expire = async () => {
    try {
      const response = await loyaltyAdminService.expire();
      toast.success(`Đã xử lý hết hạn ${response.data.expiredPoints} điểm`);
    } catch (error) {
      toast.error("Không thể xử lý điểm hết hạn");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <Sparkles className="h-4 w-4" />
                  Chương trình khách hàng thân thiết
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Loyalty khách hàng
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Thiết lập cách tích điểm, thời hạn sử dụng và các mốc nâng hạng thành viên.
                </p>
              </div>
              <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${config.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                <span className={`h-2 w-2 rounded-full ${config.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                {config.isActive ? "Đang hoạt động" : "Đang tạm dừng"}
              </div>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <CircleDollarSign className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-semibold text-slate-950">Quy tắc tích điểm</h2>
                      <p className="mt-0.5 text-sm text-slate-500">Áp dụng chung cho mọi giao dịch đủ điều kiện.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Chi tiêu để nhận 1 điểm
                      <div className="relative mt-2">
                        <input
                          type="number"
                          value={config.spendPerPoint}
                          onChange={(event) => setConfig((prev) => ({ ...prev, spendPerPoint: Number(event.target.value) }))}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-14 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">đ</span>
                      </div>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Thời hạn sử dụng điểm
                      <div className="relative mt-2">
                        <input
                          type="number"
                          value={config.pointValidityDays}
                          onChange={(event) => setConfig((prev) => ({ ...prev, pointValidityDays: Number(event.target.value) }))}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-16 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">ngày</span>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">Mốc nâng hạng</h3>
                      <p className="mt-1 text-sm text-slate-500">Thành viên tự động được nâng hạng khi đạt đủ số điểm.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-700">
                        <span className="flex items-center gap-2"><Medal className="h-4 w-4 text-slate-500" /> Hạng Silver</span>
                        <div className="relative mt-3">
                          <input
                            type="number"
                            value={config.silverMinPoints}
                            onChange={(event) => setConfig((prev) => ({ ...prev, silverMinPoints: Number(event.target.value) }))}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-16 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">điểm</span>
                        </div>
                      </label>
                      <label className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm font-medium text-slate-700">
                        <span className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Hạng Gold</span>
                        <div className="relative mt-3">
                          <input
                            type="number"
                            value={config.goldMinPoints}
                            onChange={(event) => setConfig((prev) => ({ ...prev, goldMinPoints: Number(event.target.value) }))}
                            className="h-11 w-full rounded-xl border border-amber-200 bg-white px-3 pr-16 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">điểm</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(event) => setConfig((prev) => ({ ...prev, isActive: event.target.checked }))}
                        className="peer sr-only"
                      />
                      <span className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-blue-600 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
                      <span><span className="block text-sm font-semibold text-slate-800">Bật tích điểm</span><span className="block text-xs text-slate-500">Khách hàng nhận điểm sau giao dịch</span></span>
                    </label>
                    <button
                      onClick={saveConfig}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {saving ? "Đang lưu..." : "Lưu cấu hình"}
                    </button>
                  </div>
                </div>
              </section>

              <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-blue-300">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold">Điểm hết hạn</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Quét và thu hồi các điểm đã vượt quá thời hạn sử dụng đã thiết lập.</p>
                <div className="my-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Chu kỳ hiện tại</p>
                  <p className="mt-1 text-2xl font-bold">{config.pointValidityDays} <span className="text-sm font-medium text-slate-400">ngày</span></p>
                </div>
                <button onClick={expire} className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-blue-50">
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Xử lý ngay</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </aside>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><ArrowDownToLine className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-slate-950">Điều chỉnh điểm thủ công</h2>
                  <p className="mt-1 text-sm text-slate-500">Cộng hoặc trừ điểm cho một thành viên và lưu lại lý do thay đổi.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px_1.4fr_auto] lg:items-end">
                <label className="text-sm font-medium text-slate-700">
                  Thành viên
                  <div className="relative mt-2">
                    <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Nhập User ID" />
                  </div>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Số điểm
                  <input type="number" value={adjustPoints} onChange={(event) => setAdjustPoints(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="VD: 100, -50" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Lý do điều chỉnh
                  <input value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Nhập lý do để dễ đối soát" />
                </label>
                <button onClick={adjust} className="h-11 whitespace-nowrap rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">Ghi điều chỉnh</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
