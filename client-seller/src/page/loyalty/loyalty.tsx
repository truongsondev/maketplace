import { useEffect, useState } from "react";
import { Header, Sidebar } from "@/components/admin";
import { loyaltyAdminService } from "@/services/api";
import type { LoyaltyConfig } from "@/types/api";
import { toast } from "sonner";

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
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h1 className="text-2xl font-bold text-gray-950">
                Loyalty khách hàng
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Cấu hình tích điểm đơn giản cho MEMBER, SILVER và GOLD.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-700">
                  Số tiền cho 1 điểm
                  <input
                    type="number"
                    value={config.spendPerPoint}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        spendPerPoint: Number(event.target.value),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Ngày hết hạn điểm
                  <input
                    type="number"
                    value={config.pointValidityDays}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        pointValidityDays: Number(event.target.value),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Ngưỡng SILVER
                  <input
                    type="number"
                    value={config.silverMinPoints}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        silverMinPoints: Number(event.target.value),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Ngưỡng GOLD
                  <input
                    type="number"
                    value={config.goldMinPoints}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        goldMinPoints: Number(event.target.value),
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={config.isActive}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Bật tích điểm
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
                <button
                  onClick={expire}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                >
                  Xử lý điểm hết hạn
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-950">
                Điều chỉnh điểm thủ công
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <input
                  value={adjustUserId}
                  onChange={(event) => setAdjustUserId(event.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3"
                  placeholder="User ID"
                />
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(event) => setAdjustPoints(Number(event.target.value))}
                  className="h-10 rounded-lg border border-gray-300 px-3"
                  placeholder="Điểm, ví dụ 100 hoặc -50"
                />
                <input
                  value={adjustReason}
                  onChange={(event) => setAdjustReason(event.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3"
                  placeholder="Lý do điều chỉnh"
                />
              </div>
              <button
                onClick={adjust}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white"
              >
                Ghi điều chỉnh
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
